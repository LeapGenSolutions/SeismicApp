import { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { Input } from "./input";
import { Badge } from "./badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { StickyNote, Save, X, RotateCcw, Tag, Clock, Image as ImageIcon } from "lucide-react";
import { ImageGallery } from "./image-gallery";

export function FloatingNotepad({ 
  isOpen, 
  onClose, 
  patientName, 
  appointmentId, 
  isVideoCall = false 
}) {
  const [noteData, setNoteData] = useState({
    title: "",
    content: "",
    patientName: patientName || "",
    priority: "normal",
    tags: [],
    images: []
  });
  const [currentTag, setCurrentTag] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    if (noteData.content || noteData.title) {
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [noteData.content, noteData.title]);

  // Update word count
  useEffect(() => {
    const words = noteData.content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [noteData.content]);

  const handleAutoSave = async () => {
    if (!noteData.content && !noteData.title) return;
    
    setIsSaving(true);
    try {
      // Simulate auto-save (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 500));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 w-[400px] h-full bg-gray-900 shadow-lg z-50 flex flex-col border-l border-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-blue-400" />
          <div>
            <h2 className="text-sm font-semibold text-gray-100">Quick Notes</h2>
            {isVideoCall && (
              <Badge variant="secondary" className="text-xs mt-1 bg-blue-600 text-white">
                🟢 Live Session
              </Badge>
            )}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-gray-100">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Patient Info */}
      {patientName && (
        <div className="bg-gray-800 p-3 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-100">{patientName}</h3>
              <p className="text-xs text-gray-400">Age: 34 • Checkup Appointment</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400">06:59</span>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900">
        {/* Title */}
        <div>
          <Input
            placeholder="Note title..."
            value={noteData.title}
            onChange={(e) => setNoteData((prev) => ({ ...prev, title: e.target.value }))}
            className="font-medium bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
          />
        </div>

        {/* Priority */}
        <div>
          <Select
            value={noteData.priority}
            onValueChange={(value) => setNoteData((prev) => ({ ...prev, priority: value }))}
          >
            <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="low" className="text-gray-100">Low Priority</SelectItem>
              <SelectItem value="normal" className="text-gray-100">Normal Priority</SelectItem>
              <SelectItem value="high" className="text-gray-100">High Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        <div>
          <Textarea
            placeholder="Take notes during the consultation..."
            value={noteData.content}
            onChange={(e) => setNoteData((prev) => ({ ...prev, content: e.target.value }))}
            rows={8}
            className="resize-none bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
          />
          <div className="flex justify-between items-center mt-1 text-xs text-gray-400">
            <span>{wordCount} words</span>
            {isSaving && <span>Saving...</span>}
            {lastSaved && !isSaving && (
              <span>Saved {lastSaved.toLocaleTimeString()}</span>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Add tag..."
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (currentTag.trim() && !noteData.tags.includes(currentTag.trim())) {
                    setNoteData((prev) => ({
                      ...prev,
                      tags: [...prev.tags, currentTag.trim()]
                    }));
                    setCurrentTag("");
                  }
                }
              }}
              className="text-xs flex-1 bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500"
            />
            <Button 
              size="sm" 
              onClick={() => {
                if (currentTag.trim() && !noteData.tags.includes(currentTag.trim())) {
                  setNoteData((prev) => ({
                    ...prev,
                    tags: [...prev.tags, currentTag.trim()]
                  }));
                  setCurrentTag("");
                }
              }} 
              disabled={!currentTag.trim()}
              className="bg-gray-800 text-gray-100 hover:bg-gray-700"
            >
              <Tag className="w-3 h-3" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-1">
            {noteData.tags.map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs flex items-center gap-1 bg-gray-800 text-gray-100"
              >
                {tag}
                <X 
                  className="w-2 h-2 cursor-pointer hover:text-red-400" 
                  onClick={() => {
                    setNoteData((prev) => ({
                      ...prev,
                      tags: prev.tags.filter((t) => t !== tag)
                    }));
                  }} 
                />
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 bg-gray-900">
        <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
          <div className="flex items-center space-x-2">
            <Clock className="w-3 h-3" />
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
          {patientName && (
            <span className="text-blue-400 font-medium">Patient: {patientName}</span>
          )}
        </div>
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => {
              setNoteData({
                title: "",
                content: "",
                patientName: patientName || "",
                priority: "normal",
                tags: [],
                images: []
              });
              setCurrentTag("");
              setLastSaved(null);
            }}
            className="flex-1 border-gray-700 text-gray-100 hover:bg-gray-800"
          >
            <RotateCcw className="w-3 h-3 mr-1" /> Clear
          </Button>
          <Button 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
            onClick={handleAutoSave}
            disabled={isSaving}
          >
            <Save className="w-3 h-3 mr-1" /> 
            {isSaving ? 'Saving...' : 'Save Note'}
          </Button>
        </div>
      </div>
    </div>
  );
} 