import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function ReportForm() {
    const [description, setDescription] = useState("");
    const [photo, setPhoto] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const getLocation = (): Promise<{ lat: number; lng: number }> => {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (pos) =>
                    resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => reject(err),
            );
        });
    };

    const handleSubmit = async () => {
        if (!photo || !description) {
            setMessage("Please add a photo and description");
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
                description,
                status: "reported",
            });

            if (insertError) throw insertError;

            setMessage("Report submitted successfully!");
            setDescription("");
            setPhoto(null);
        } catch (err: any) {
            setMessage(err.message || "Something went wrong");
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
                className="w-full mb-4"
                type="file"
                accept="image/*"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
            />

            <button
                className="w-full bg-green-600 text-white p-2 rounded"
                onClick={handleSubmit}
                disabled={loading}
            >
                {loading ? "Submitting..." : "Submit Report"}
            </button>

            {message && (
                <p className="mt-4 text-sm text-center text-red-500">{message}</p>
            )}
        </div>
    );
}
