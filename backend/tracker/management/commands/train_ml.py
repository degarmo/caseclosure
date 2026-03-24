"""
Management command: python manage.py train_ml

Trains the ML models using:
  1. ALL TrackingEvents  → IsolationForest (unsupervised, no labels needed)
  2. Labeled fingerprints (MLTrainingLabel) → GradientBoosting + RandomForest

After training, models are saved to MEDIA_ROOT/ml_models/*.joblib and loaded
by CriminalMLAnalyzer.load_models() on the next server restart (or immediately
via the --reload flag).

Usage:
  python manage.py train_ml               # train with all available data
  python manage.py train_ml --dry-run     # show what would be trained
  python manage.py train_ml --reload      # train + hot-reload in this process
"""

import os
import json
import logging
from pathlib import Path
from datetime import timedelta

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.conf import settings

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Train / retrain ML models from TrackingEvents and investigator labels"

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be trained without saving models',
        )
        parser.add_argument(
            '--reload',
            action='store_true',
            help='Hot-reload the trained models in the current process after training',
        )
        parser.add_argument(
            '--days',
            type=int,
            default=180,
            help='Number of days of events to use for unsupervised training (default 180)',
        )
        parser.add_argument(
            '--min-labeled',
            type=int,
            default=5,
            help='Minimum labeled samples required to train supervised models (default 5)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        do_reload = options['reload']
        days = options['days']
        min_labeled = options['min_labeled']

        self.stdout.write(self.style.MIGRATE_HEADING("\n=== CaseClosure ML Training ===\n"))

        # ── imports ──────────────────────────────────────────────────────────
        try:
            import numpy as np
            import joblib
            from sklearn.ensemble import IsolationForest, GradientBoostingClassifier, RandomForestClassifier
            from sklearn.preprocessing import StandardScaler
            from sklearn.model_selection import train_test_split
            from sklearn.metrics import classification_report
        except ImportError as exc:
            raise CommandError(
                f"scikit-learn / joblib not installed: {exc}\n"
                "Run: pip install scikit-learn joblib"
            )

        try:
            from tracker.models import TrackingEvent, MLTrainingLabel
            from tracker.ml_analyzer import CriminalMLAnalyzer
        except ImportError as exc:
            raise CommandError(f"Import error: {exc}")

        # ── model output directory ────────────────────────────────────────────
        model_dir = Path(getattr(settings, 'MEDIA_ROOT', '/tmp')) / 'ml_models'
        if not dry_run:
            model_dir.mkdir(parents=True, exist_ok=True)
        self.stdout.write(f"Model directory: {model_dir}")

        ml_analyzer = CriminalMLAnalyzer()

        # ════════════════════════════════════════════════════════════════════
        # PHASE 1: Unsupervised — IsolationForest on all recent events
        # ════════════════════════════════════════════════════════════════════
        self.stdout.write(self.style.HTTP_INFO("\n[Phase 1] IsolationForest (unsupervised)"))

        cutoff = timezone.now() - timedelta(days=days)
        events_qs = TrackingEvent.objects.filter(
            timestamp__gte=cutoff
        ).values(
            'timestamp', 'page_url', 'time_on_page', 'clicks_count',
            'scroll_depth', 'is_vpn', 'is_tor', 'is_proxy',
            'fingerprint_hash', 'ip_address', 'device_type', 'browser',
            'is_unusual_hour', 'case__created_at',
        ).order_by('-timestamp')[:50_000]

        events_list = list(events_qs)
        total_events = len(events_list)
        self.stdout.write(f"  Events loaded: {total_events}")

        if total_events < 10:
            self.stdout.write(
                self.style.WARNING("  ⚠ Not enough events for IsolationForest (need ≥10). Skipping.")
            )
        else:
            # Build feature matrix
            X_unsup = []
            for ev in events_list:
                try:
                    session_data = {
                        'timestamp': ev['timestamp'],
                        'case_start_date': ev['case__created_at'] or ev['timestamp'],
                        'pages': [ev['page_url'] or ''],
                        'duration': ev['time_on_page'] or 0,
                        'clicks': ev['clicks_count'] or 0,
                        'scroll_depths': [ev['scroll_depth'] or 0],
                        'is_vpn': ev['is_vpn'] or False,
                        'is_tor': ev['is_tor'] or False,
                        'is_proxy': ev['is_proxy'] or False,
                        'fingerprint_hash': ev['fingerprint_hash'] or '',
                        'ip_address': ev['ip_address'] or '',
                        'device_type': ev['device_type'] or '',
                        'browser': ev['browser'] or '',
                    }
                    feats = ml_analyzer.extract_criminal_features(session_data)
                    X_unsup.append(list(feats.values()))
                except Exception:
                    continue

            X_unsup = np.array(X_unsup, dtype=float)
            self.stdout.write(f"  Feature matrix: {X_unsup.shape}")

            if not dry_run:
                scaler = StandardScaler()
                X_scaled = scaler.fit_transform(X_unsup)

                iforest = IsolationForest(
                    n_estimators=200,
                    contamination=0.05,
                    random_state=42,
                    n_jobs=-1,
                )
                iforest.fit(X_scaled)

                joblib.dump(iforest, model_dir / 'isolation_forest.joblib')
                joblib.dump(scaler,  model_dir / 'scaler.joblib')
                self.stdout.write(self.style.SUCCESS("  ✓ IsolationForest saved"))
            else:
                self.stdout.write("  [dry-run] Would train IsolationForest")

        # ════════════════════════════════════════════════════════════════════
        # PHASE 2: Supervised — GradientBoosting + RandomForest on labels
        # ════════════════════════════════════════════════════════════════════
        self.stdout.write(self.style.HTTP_INFO("\n[Phase 2] Supervised classifiers"))

        labels = list(MLTrainingLabel.objects.select_related('case').all())
        self.stdout.write(f"  Training labels: {len(labels)}")

        label_summary = {}
        for lbl in labels:
            label_summary[lbl.label] = label_summary.get(lbl.label, 0) + 1
        for k, v in label_summary.items():
            self.stdout.write(f"    {k}: {v}")

        if len(labels) < min_labeled:
            self.stdout.write(
                self.style.WARNING(
                    f"  ⚠ Need at least {min_labeled} labels to train supervised models. "
                    f"Have {len(labels)}. Skipping supervised training.\n"
                    "  → Use the Django admin or the Suspects panel to label fingerprints."
                )
            )
        else:
            X_sup, y_sup = [], []
            skipped = 0
            for lbl in labels:
                try:
                    # Pull last 10 events for this fingerprint
                    ev_qs = TrackingEvent.objects.filter(
                        fingerprint_hash=lbl.fingerprint_hash
                    ).order_by('-timestamp')[:10]

                    for ev in ev_qs:
                        session_data = {
                            'timestamp': ev.timestamp,
                            'case_start_date': ev.case.created_at if ev.case else ev.timestamp,
                            'pages': [ev.page_url or ''],
                            'duration': ev.time_on_page or 0,
                            'clicks': ev.clicks_count or 0,
                            'scroll_depths': [ev.scroll_depth or 0],
                            'is_vpn': ev.is_vpn,
                            'is_tor': ev.is_tor,
                            'is_proxy': ev.is_proxy,
                            'fingerprint_hash': ev.fingerprint_hash or '',
                            'ip_address': ev.ip_address or '',
                            'device_type': ev.device_type or '',
                            'browser': ev.browser or '',
                        }
                        feats = ml_analyzer.extract_criminal_features(session_data)
                        X_sup.append(list(feats.values()))
                        y_sup.append(1 if lbl.is_positive else 0)
                except Exception as exc:
                    skipped += 1
                    logger.debug(f"Skipped label {lbl.fingerprint_hash[:8]}: {exc}")

            self.stdout.write(f"  Feature rows: {len(X_sup)}  (skipped {skipped} labels)")

            if len(X_sup) < min_labeled:
                self.stdout.write(self.style.WARNING("  ⚠ Too few feature rows. Skipping supervised training."))
            elif not dry_run:
                X_sup = np.array(X_sup, dtype=float)
                y_sup = np.array(y_sup)

                # Train/test split when possible
                if len(X_sup) >= 20:
                    X_tr, X_te, y_tr, y_te = train_test_split(
                        X_sup, y_sup, test_size=0.2, random_state=42, stratify=y_sup
                    )
                else:
                    X_tr, y_tr = X_sup, y_sup
                    X_te, y_te = None, None

                # GradientBoosting
                gb = GradientBoostingClassifier(
                    n_estimators=200, max_depth=4, learning_rate=0.05,
                    random_state=42,
                )
                gb.fit(X_tr, y_tr)
                joblib.dump(gb, model_dir / 'gradient_boosting.joblib')
                self.stdout.write(self.style.SUCCESS("  ✓ GradientBoostingClassifier saved"))

                # RandomForest
                rf = RandomForestClassifier(
                    n_estimators=200, max_depth=8, random_state=42, n_jobs=-1
                )
                rf.fit(X_tr, y_tr)
                joblib.dump(rf, model_dir / 'random_forest.joblib')
                self.stdout.write(self.style.SUCCESS("  ✓ RandomForestClassifier saved"))

                # Metrics
                if X_te is not None:
                    self.stdout.write("\n  GradientBoosting classification report:")
                    self.stdout.write(classification_report(y_te, gb.predict(X_te),
                                                             target_names=['innocent', 'suspect']))

                # Save training metadata
                meta = {
                    'trained_at': timezone.now().isoformat(),
                    'total_events_unsupervised': total_events,
                    'labeled_samples': len(labels),
                    'feature_rows': len(X_sup),
                    'label_breakdown': label_summary,
                }
                (model_dir / 'training_meta.json').write_text(json.dumps(meta, indent=2))
                self.stdout.write(self.style.SUCCESS("  ✓ Training metadata saved"))
            else:
                self.stdout.write(f"  [dry-run] Would train supervised models on {len(X_sup)} rows")

        # ── optional hot-reload ───────────────────────────────────────────────
        if do_reload and not dry_run:
            self.stdout.write(self.style.HTTP_INFO("\n[Phase 3] Hot-reloading models"))
            try:
                ml_analyzer.load_models()
                self.stdout.write(self.style.SUCCESS("  ✓ Models reloaded in this process"))
            except Exception as exc:
                self.stdout.write(self.style.WARNING(f"  ⚠ Reload failed: {exc}"))

        self.stdout.write(self.style.SUCCESS("\n✅ Training complete.\n"))
