import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const toolbarOptions = [
  ['bold', 'italic', 'underline'],
  [{ 'color': [] }, { 'background': [] }],
  [{ 'header': [1, 2, 3, false] }],
  [{ 'list': 'ordered' }, { 'list': 'bullet' }],
  ['clean']
];

const DoctorNotesPanel = ({ callId, onClose }) => {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await fetch(`/api/notes/${callId}`);
        const data = await res.json();
        if (data?.content) setNotes(data.content);
      } catch (err) {
        console.error('Failed to load notes:', err);
      }
    };
    fetchNotes();
  }, [callId]);

  const saveNotes = async () => {
    setSaving(true);
    try {
      await fetch(`/api/notes/${callId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: notes }),
      });
    } catch (err) {
      console.error('Error saving notes:', err);
    }
    setSaving(false);
  };

  return (
    <div className="fixed top-0 right-0 w-full max-w-md h-full bg-white border-l shadow-lg z-50 flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">Doctor Notes</h2>
        <button
          onClick={onClose}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ✖
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <ReactQuill
          theme="snow"
          value={notes}
          onChange={setNotes}
          modules={{ toolbar: toolbarOptions }}
        />
      </div>

      <div className="p-4 border-t flex justify-end">
        <button
          onClick={saveNotes}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Notes'}
        </button>
      </div>
    </div>
  );
};

export default DoctorNotesPanel;

// import React from 'react';
// import ReactQuill from 'react-quill';
// import 'react-quill/dist/quill.snow.css';

// const toolbarOptions = [
//   ['bold', 'italic', 'underline'],
//   [{ color: [] }, { background: [] }],
//   [{ header: [1, 2, 3, false] }],
//   [{ list: 'ordered' }, { list: 'bullet' }],
//   ['clean'],
// ];

// const DoctorNotesPanel = ({ notes, setNotes, onClose }) => {
//   return (
//     <div className="fixed top-20 right-4 w-[400px] h-[75vh] bg-white border rounded-lg shadow-lg p-4 z-50 flex flex-col">
//       <div className="flex justify-between items-center mb-2">
//         <h2 className="text-lg font-semibold">Doctor Notes</h2>
//         <button
//           onClick={onClose}
//           className="text-gray-600 hover:text-gray-900 text-lg"
//         >
//           ✕
//         </button>
//       </div>

//       <ReactQuill
//         theme="snow"
//         value={notes}
//         onChange={setNotes}
//         modules={{ toolbar: toolbarOptions }}
//         style={{ flexGrow: 1 }}
//         placeholder="Write your notes here..."
//       />
//     </div>
//   );
// };

// export default DoctorNotesPanel;
