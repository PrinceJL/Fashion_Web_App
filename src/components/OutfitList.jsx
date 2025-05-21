import React, { useEffect, useState } from "react";

// Helper to extract file ID from Google Drive link
function extractGoogleDriveFileId(url) {
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// Get direct image URL for Google Drive
function getGoogleDriveDirectUrl(url) {
  const fileId = extractGoogleDriveFileId(url);
  return fileId ? `https://drive.google.com/uc?export=view&id=${fileId}` : url;
}

// Download and cache images as blobs for Google Drive links only
function useDisplayImageUrl(imageUrl) {
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    let active = true;
    let objectUrl = null;

    async function fetchImage() {
      // Only fetch as blob for Google Drive images
      if (imageUrl && imageUrl.includes("drive.google.com")) {
        const directUrl = getGoogleDriveDirectUrl(imageUrl);
        try {
          const res = await fetch(directUrl);
          if (!res.ok) throw new Error("Failed to fetch image");
          const blob = await res.blob();
          objectUrl = URL.createObjectURL(blob);
          if (active) setBlobUrl(objectUrl);
        } catch {
          setBlobUrl(null);
        }
      } else {
        setBlobUrl(null); // Not a Drive link, use regular src
      }
    }

    fetchImage();

    // Cleanup blob URLs when component unmounts or imageUrl changes
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setBlobUrl(null);
      active = false;
    };
  }, [imageUrl]);

  // If blobUrl, use it; else use the original imageUrl
  return blobUrl || (!imageUrl?.includes("drive.google.com") ? imageUrl : null);
}

export default function OutfitList({ recommendations }) {
  if (!recommendations?.length) return null;
  return (
    <div className="outfits">
      <h2>Recommended Outfits</h2>
      <ul>
        {recommendations.map((rec, idx) => {
          const displayUrl = useDisplayImageUrl(rec.image_url);
          const driveLink = extractGoogleDriveFileId(rec.image_url)
            ? `https://drive.google.com/file/d/${extractGoogleDriveFileId(rec.image_url)}/view`
            : rec.image_url;
          return (
            <li key={idx} className="outfit-item">
              {displayUrl ? (
                <a href={driveLink} target="_blank" rel="noopener noreferrer">
                  <img src={displayUrl} alt={rec.image_label} width={150} />
                </a>
              ) : (
                <span>No Image</span>
              )}
              <div>
                <strong>{rec.image_label}</strong>
                <div>Gender: {rec.gender}</div>
                <div>Body Shape: {rec.attributes?.body_shape || "N/A"}</div>
                <div>Style Score: {rec.style_score}</div>
                <div>Total Score: {rec.total_score}</div>
                {driveLink && driveLink !== rec.image_url && (
                  <div>
                    <a href={driveLink} target="_blank" rel="noopener noreferrer">
                      View on Google Drive
                    </a>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}