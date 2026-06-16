import { useState, useRef } from "react";
import { supabase } from "../supabaseClient";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function ReportForm() {
    const [description, setDescription] = useState("");
    const [photo, setPhoto] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false); // tracks message type for styling
    const fileInputRef = useRef<HTMLInputElement>(null); // needed to manually clear file input

    const getLocation = (): Promise<{ lat: number; lng: number }> => {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (pos) =>
                    resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => {
                    // Map cryptic browser error codes to readable messages
                    if (err.code === err.PERMISSION_DENIED) {
                        reject(new Error("Location permission denied. Enable location access in your browser settings and try again."));
                    } else if (err.code === err.POSITION_UNAVAILABLE) {
                        reject(new Error("Could not detect your location. Check your GPS or network connection."));
                    } else if (err.code === err.TIMEOUT) {
                        reject(new Error("Location request timed out. Try again."));
                    } else {
                        reject(new Error("Could not get your location."));
                    }
                },
                { timeout: 10000 }
            );
        });
    };

    const handleSubmit = async () => {
        const trimmedDescription = description.trim();

        if (!photo || !trimmedDescription) {
            setMessage("Please add a photo and description");
            setIsSuccess(false);
            return;
        }

        if (photo.size > MAX_FILE_SIZE) {
            setMessage("Photo is too large. Max size is 5MB.");
            setIsSuccess(false);
            return;
        }

        setLoading(true);

        try {
            const { lat, lng } = await getLocation();

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not logged in");

            const fileExt = photo.name.split(".").pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("reports")
                .upload(fileName, photo);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from("reports")
                .getPublicUrl(fileName);

            const { error: insertError } = await supabase.from("reports").insert({
                citizen_id: user.id,
                photo_url: urlData.publicUrl,
                lat,
                lng,
                description: trimmedDescription,
                status: "reported",
            });

            if (insertError) throw insertError;

            setMessage("Report submitted successfully!");
            setIsSuccess(true);
            setDescription("");
            setPhoto(null);

            // Native file inputs ignore state changes — must clear manually
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (err: any) {
            setMessage(err.message || "Something went wrong");
            setIsSuccess(false);
        }

        setLoading(false);
    };

    return (
        <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Report Garbage</h2>

            <textarea
                className="w-full border p-2 mb-4 rounded"
                placeholder="Describe the garbage location..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
            />

            <input
                ref={fileInputRef}
                className="w-full mb-4"
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            />

            <button
                className="w-full bg-green-600 text-white p-2 rounded disabled:opacity-50"
                onClick={handleSubmit}
                disabled={loading}
            >
                {loading ? "Submitting..." : "Submit Report"}
            </button>

            {message && (
                <p className={`mt-4 text-sm text-center ${isSuccess ? "text-green-600" : "text-red-500"}`}>
                    {message}
                </p>
            )}
        </div>
    );
}
