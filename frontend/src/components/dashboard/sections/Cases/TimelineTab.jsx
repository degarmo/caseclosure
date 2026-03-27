// src/dashboard/sections/Cases/TimelineTab.jsx
import React, { useState, useEffect } from 'react';
import api from '@/api/config';
import {
  Plus, Edit, Trash2, Calendar, MapPin, ExternalLink,
  Star, AlertTriangle, Shield, Gavel, Heart, Newspaper,
  Save, X, Loader, Clock, Eye
} from 'lucide-react';

const EVENT_TYPE_OPTIONS = [
  { value: 'incident', label: 'Incident', icon: AlertTriangle, color: 'bg-red-500' },
  { value: 'investigation', label: 'Investigation', icon: Shield, color: 'bg-blue-500' },
  { value: 'arrest', label: 'Arrest', icon: Gavel, color: 'bg-orange-500' },
  { value: 'court', label: 'Court', icon: Gavel, color: 'bg-purple-500' },
  { value: 'memorial', label: 'Memorial', icon: Heart, color: 'bg-pink-500' },
  { value: 'media', label: 'Media Coverage', icon: Newspaper, color: 'bg-green-500' },
  { value: 'sighting', label: 'Sighting', icon: Eye, color: 'bg-teal-500' },
  { value: 'other', label: 'Other', icon: Star, color: 'bg-slate-500' },
];

const emptyEvent = {
  title: '',
  description: '',
  event_type: 'other',
  date: '',
  time: '',
  location: '',
  source_url: '',
  is_major: false,
};

function EventForm({ event, onSave, onCancel, saving }) {
  const [form, setForm] = useState(event || emptyEvent);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Clean up empty time field
    const payload = { ...form };
    if (!payload.time) delete payload.time;
    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 border border-slate-200 dark:border-slate-600 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={e => handleChange('title', e.target.value)}
            placeholder="e.g., Last seen at grocery store"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Event Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Event Type</label>
          <select
            value={form.event_type}
            onChange={e => handleChange('event_type', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            {EVENT_TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            required
            value={form.date}
            onChange={e => handleChange('date', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Time (optional) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Time (optional)</label>
          <input
            type="time"
            value={form.time || ''}
            onChange={e => handleChange('time', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location (optional)</label>
          <input
            type="text"
            value={form.location}
            onChange={e => handleChange('location', e.target.value)}
            placeholder="e.g., Downtown Portland, OR"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={form.description}
            onChange={e => handleChange('description', e.target.value)}
            placeholder="Describe what happened..."
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-y"
          />
        </div>

        {/* Source URL */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Source URL (optional)</label>
          <input
            type="url"
            value={form.source_url}
            onChange={e => handleChange('source_url', e.target.value)}
            placeholder="https://news-article-link.com"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Major event toggle */}
        <div className="md:col-span-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_major}
              onChange={e => handleChange('is_major', e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mark as a major event (highlighted on timeline)</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {event?.id ? 'Update Event' : 'Add Event'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 rounded-lg font-medium text-sm transition-colors"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </form>
  );
}

function EventCard({ event, onEdit, onDelete, deleting }) {
  const config = EVENT_TYPE_OPTIONS.find(o => o.value === event.event_type) || EVENT_TYPE_OPTIONS[EVENT_TYPE_OPTIONS.length - 1];
  const Icon = config.icon;

  // Parse date without UTC shift
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border ${event.is_major ? 'border-yellow-300 shadow-yellow-100' : 'border-slate-200 dark:border-slate-700'} p-4 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`p-2 ${config.color} rounded-lg shrink-0`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="font-semibold text-slate-900 dark:text-white">{event.title}</h4>
              {event.is_major && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                  <Star className="w-3 h-3" /> Major
                </span>
              )}
              <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs font-medium">
                {config.label}
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">{event.description}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(event.date)}
              </span>
              {event.time && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {event.time}
                </span>
              )}
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {event.location}
                </span>
              )}
              {event.source_url && (
                <a href={event.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                  <ExternalLink className="w-3 h-3" />
                  Source
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(event)}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(event.id)}
            disabled={deleting === event.id}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
            title="Delete"
          >
            {deleting === event.id ? <Loader className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TimelineTab({ caseId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const loadEvents = async () => {
    try {
      const res = await api.get(`/timeline-events/?case_id=${caseId}`);
      setEvents(res.data.results || res.data);
      setError('');
    } catch (err) {
      setError('Failed to load timeline events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [caseId]);

  const handleSave = async (formData) => {
    setSaving(true);
    setError('');
    try {
      if (editingEvent?.id) {
        await api.put(`/timeline-events/${editingEvent.id}/`, { ...formData, case: caseId });
      } else {
        await api.post('/timeline-events/', { ...formData, case: caseId });
      }
      setShowForm(false);
      setEditingEvent(null);
      await loadEvents();
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === 'object' ? Object.values(detail).flat().join(', ') : 'Failed to save event';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Delete this timeline event?')) return;
    setDeleting(eventId);
    try {
      await api.delete(`/timeline-events/${eventId}/`);
      await loadEvents();
    } catch {
      setError('Failed to delete event');
    } finally {
      setDeleting(null);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEvent(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Case Timeline</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Add key events to build a chronological timeline for this case's public page.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setEditingEvent(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <EventForm
          event={editingEvent}
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving}
        />
      )}

      {/* Events list */}
      {events.length === 0 && !showForm ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-700/30 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">No timeline events yet</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Start building your case timeline by adding the first event.
          </p>
          <button
            onClick={() => { setEditingEvent(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Event
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={handleEdit}
              onDelete={handleDelete}
              deleting={deleting}
            />
          ))}
        </div>
      )}
    </div>
  );
}
