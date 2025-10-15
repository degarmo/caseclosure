// src/components/spotlight/SpotlightEditor.jsx
import React, { useState, useCallback } from 'react';
import { X, Calendar, ImageIcon, MapPin, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import RichTextEditor from '@/common/RichTextEditor';
import SpotlightScheduler from './SpotlightScheduler';

const SpotlightEditor = ({ onSubmit, onCancel, initialData = null, caseId = null, caseName = null, cases = [] }) => {
  const [selectedCase, setSelectedCase] = useState(caseId || initialData?.case || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [postType, setPostType] = useState(initialData?.post_type || 'update');
  const [priority, setPriority] = useState(initialData?.priority || 'medium');
  const [isSensitive, setIsSensitive] = useState(initialData?.is_sensitive || false);
  const [tags, setTags] = useState(initialData?.tags?.join(', ') || '');
  const [images, setImages] = useState([]);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(null);
  const [status, setStatus] = useState('published');

  const postTypes = [
    { value: 'update', label: 'Case Update' },
    { value: 'memorial', label: 'Memorial' },
    { value: 'appeal', label: 'Public Appeal' },
    { value: 'news', label: 'News' },
    { value: 'evidence', label: 'Evidence' }
  ];

  const priorities = [
    { value: 'low', label: 'Low Priority' },
    { value: 'medium', label: 'Medium Priority' },
    { value: 'high', label: 'High Priority' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const handleImageUpload = useCallback((e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImages(prev => [...prev, {
          file,
          preview: event.target.result
        }]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validate case selection
    if (!selectedCase && !caseId) {
      alert('Please select a case');
      return;
    }

    // Prepare post data
    const postData = {
      case: selectedCase || caseId,  // ✅ IMPORTANT: Include case ID
      title,
      content,
      status: scheduledDate ? 'scheduled' : status,
      post_type: postType,
      priority,
      is_sensitive: isSensitive,
    };

    // Add tags
    const tagsArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);
    if (tagsArray.length > 0) {
      postData.tags = tagsArray;
    }

    // Add scheduled date if set
    if (scheduledDate) {
      postData.scheduled_for = scheduledDate.toISOString();
    }

    // Add first image as featured_image if exists
    if (images.length > 0) {
      postData.featured_image = images[0].file;
    }

    await onSubmit(postData);
  };

  const isContentEmpty = () => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    return !text.trim();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Editor Modal */}
      <Card className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <div className="sticky top-0 z-10 bg-white border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-slate-600" />
              <h2 className="text-xl font-bold">Create Spotlight Post</h2>
              {caseName && (
                <Badge variant="outline" className="ml-2">
                  {caseName}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {!caseId && cases.length > 0 && (
            <div>
              <Label>Select Case *</Label>
              <Select value={selectedCase} onValueChange={setSelectedCase}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose which case this post is for" />
                </SelectTrigger>
                <SelectContent>
                  {cases.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.case_title || `${c.first_name} ${c.last_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Post Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Post Type</Label>
              <Select value={postType} onValueChange={setPostType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {postTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map(p => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Title */}
          <div>
            <Label>Title (optional)</Label>
            <Input
              placeholder="Add a compelling title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Rich Text Editor */}
          <div>
            <Label>Content</Label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Share your update with the community..."
              maxLength={5000}
              minHeight="250px"
              showToolbar={true}
            />
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <Input
              placeholder="Add tags separated by commas..."
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          {/* Image Upload */}
          <div>
            <Label>Images</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <label className="flex flex-col items-center cursor-pointer">
                <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">Click to upload images</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-3">
                {images.map((img, index) => (
                  <div key={index} className="relative rounded-lg overflow-hidden">
                    <img 
                      src={img.preview} 
                      alt="" 
                      className="w-full h-24 object-cover"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => removeImage(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sensitive Content Toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <Label htmlFor="sensitive" className="cursor-pointer">
                Mark as sensitive content
              </Label>
            </div>
            <Switch
              id="sensitive"
              checked={isSensitive}
              onCheckedChange={setIsSensitive}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setShowScheduler(!showScheduler)}
            >
              <Calendar className="w-4 h-4 mr-2" />
              {scheduledDate ? 'Scheduled' : 'Schedule'}
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>
              
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Save Draft</SelectItem>
                  <SelectItem value="published">Publish</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                onClick={handleSubmit}
                disabled={isContentEmpty() || (!selectedCase && !caseId)}
                className="bg-slate-800 hover:bg-slate-700 text-white"
              >
                {scheduledDate ? 'Schedule' : status === 'draft' ? 'Save' : 'Post'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {showScheduler && (
        <SpotlightScheduler
          onSchedule={(date) => {
            setScheduledDate(date);
            setShowScheduler(false);
          }}
          onCancel={() => setShowScheduler(false)}
          initialDate={scheduledDate}
        />
      )}
    </div>
  );
};

export default SpotlightEditor;