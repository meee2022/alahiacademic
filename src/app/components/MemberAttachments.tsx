"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, UploadCloud, FileText, Trash2, DownloadCloud, Eye, X } from "lucide-react";
import { insforge } from "@/lib/insforge/client";

interface DocRecord {
  id: string;
  memberId: string;
  fileName: string;
  fileUrl: string;
  fileKey: string;
  fileSize: number;
  createdAt: string;
}

export default function MemberAttachments({ memberId }: { memberId: string }) {
  const [docs, setDocs] = useState<DocRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocs();
  }, [memberId]);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const { data, error } = await insforge.database
        .from("MemberDocument")
        .select("*")
        .eq("memberId", memberId)
        .order("createdAt", { ascending: false });
      if (error) throw error;
      setDocs((data as DocRecord[]) || []);
    } catch (err) {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const currentFile = e.target.files[0];
    setUploading(true);
    try {
      const extension = currentFile.name.split('.').pop();
      const storageKey = `${memberId}/doc-${Date.now()}.${extension}`;
      const { data: uploadData, error: uploadError } = await insforge.storage
        .from("members-docs")
        .upload(storageKey, currentFile);
      if (uploadError) throw uploadError;
      if (!uploadData) throw new Error("No upload data returned");
      const { error: dbError } = await insforge.database
        .from("MemberDocument")
        .insert([{
          memberId,
          fileName: currentFile.name,
          fileUrl: uploadData.url,
          fileKey: uploadData.key,
          fileSize: currentFile.size,
        }]);
      if (dbError) throw dbError;
      await fetchDocs();
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء رفع الملف");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (doc: DocRecord) => {
    if (!confirm("هل أنت متأكد من حذف هذا المرفق؟")) return;
    try {
      await insforge.storage.from("members-docs").remove(doc.fileKey);
      await insforge.database.from("MemberDocument").delete().eq("id", doc.id);
      await fetchDocs();
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء حذف الملف");
    }
  };

  const downloadFile = async (doc: DocRecord) => {
    try {
      const { data, error } = await insforge.storage
        .from("members-docs")
        .download(doc.fileKey);
      if (error) throw error;
      if (data) {
        const url = URL.createObjectURL(data as Blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = doc.fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      if (doc.fileUrl) window.open(doc.fileUrl, "_blank");
    }
  };

  const isImage = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || "";
    return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext);
  };

  const isPdf = (fileName: string) => fileName.split('.').pop()?.toLowerCase() === "pdf";

  const previewFile = async (doc: DocRecord) => {
    try {
      const { data, error } = await insforge.storage
        .from("members-docs")
        .download(doc.fileKey);
      
      if (error || !data) {
        // Fallback to direct URL
        window.open(doc.fileUrl, "_blank");
        return;
      }

      const blobUrl = URL.createObjectURL(data as Blob);
      
      if (isImage(doc.fileName)) {
        setPreview({ url: blobUrl, name: doc.fileName });
      } else {
        // PDF and others: open in new tab
        window.open(blobUrl, "_blank");
      }
    } catch {
      if (doc.fileUrl) window.open(doc.fileUrl, "_blank");
    }
  };

  const getFileEmoji = (fileName: string) => {
    if (isImage(fileName)) return "🖼️";
    if (isPdf(fileName)) return "📄";
    return "📎";
  };

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h2 className="text-lg font-bold text-gray-800">المرفقات (بطاقة/جواز)</h2>
          <div>
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleUpload}
              accept="image/*,.pdf"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 text-sm bg-[#fdfaf6] text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-[#f8f5f0] transition-colors font-semibold disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4 text-blue-600" />}
              رفع مستند
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">لا يوجد مرفقات</p>
          </div>
        ) : (
          <div className="space-y-3">
            {docs.map((doc) => (
              <div key={doc.id} className="flex justify-between items-center p-3 bg-[#fdfaf6] rounded-lg border border-gray-100 hover:border-gray-200 transition-colors group">
                {/* Clickable file name */}
                <button
                  onClick={() => previewFile(doc)}
                  className="flex items-center gap-3 overflow-hidden flex-1 min-w-0 text-right"
                  title="اضغط للمعاينة"
                >
                  <div className="p-2 bg-indigo-50 rounded-md text-lg shrink-0">
                    {getFileEmoji(doc.fileName)}
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-[#8A1538] transition-colors">{doc.fileName}</p>
                    <p className="text-xs text-gray-500">{new Date(doc.createdAt).toLocaleDateString('ar-EG')} • {Math.round(doc.fileSize / 1024)} KB</p>
                  </div>
                </button>

                <div className="flex gap-1.5 shrink-0 mr-2">
                  <button onClick={() => previewFile(doc)} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-md transition-colors" title="معاينة">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button onClick={() => downloadFile(doc)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="تحميل">
                    <DownloadCloud className="h-4 w-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(doc); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors" title="حذف">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {preview && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative max-w-4xl w-full flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-full flex justify-between items-center mb-3 text-white px-1">
              <span className="text-sm font-bold truncate max-w-[80%]">{preview.name}</span>
              <button
                onClick={() => setPreview(null)}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors shrink-0 ml-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <img
              src={preview.url}
              alt={preview.name}
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
