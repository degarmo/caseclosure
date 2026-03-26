from django.db import migrations


def fix_leo_account_type(apps, schema_editor):
    """
    'leo' was stored by mistake — the valid CustomUser choice is 'detective'.
    Update any users that got the wrong value.
    """
    User = apps.get_model('accounts', 'CustomUser')
    updated = User.objects.filter(account_type='leo').update(account_type='detective')
    if updated:
        print(f"  Fixed {updated} user(s): account_type 'leo' → 'detective'")


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_sitesettings_invite_only_mode'),
    ]

    operations = [
        migrations.RunPython(fix_leo_account_type, migrations.RunPython.noop),
    ]
