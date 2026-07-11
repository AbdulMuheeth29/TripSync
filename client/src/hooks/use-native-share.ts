import { useHapticFeedback } from "./use-haptic-feedback";

interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

export function useNativeShare() {
  const { notification } = useHapticFeedback();

  const isSupported = typeof navigator !== "undefined" && "share" in navigator;
  const canShareFiles = typeof navigator !== "undefined" && navigator.canShare?.({ files: [] as File[] });

  const share = async (data: ShareData): Promise<boolean> => {
    if (!isSupported) {
      console.warn("Web Share API not supported");
      return false;
    }

    try {
      // Validate share data
      const shareData: ShareData = {};

      if (data.title) shareData.title = data.title;
      if (data.text) shareData.text = data.text;
      if (data.url) shareData.url = data.url;

      // Add files if supported
      if (data.files && canShareFiles) {
        shareData.files = data.files;
      }

      // Check if data can be shared
      if (navigator.canShare && !navigator.canShare(shareData)) {
        console.warn("Cannot share provided data");
        return false;
      }

      await navigator.share(shareData);

      // Success haptic
      notification("success");
      return true;
    } catch (error: any) {
      // User canceled or error occurred
      if (error.name === "AbortError") {
        // User canceled - not an error
        return false;
      }

      console.error("Share failed:", error);
      notification("error");
      return false;
    }
  };

  const shareTrip = async (tripId: string, tripName: string) => {
    const url = `${window.location.origin}/trip/${tripId}`;
    return share({
      title: `Join my trip: ${tripName}`,
      text: `Check out our group trip to ${tripName} on TripSync!`,
      url
    });
  };

  const shareInvite = async (inviteUrl: string, tripName: string) => {
    return share({
      title: `Join our trip to ${tripName}`,
      text: `You're invited to join our group trip! Use this link to join:`,
      url: inviteUrl
    });
  };

  const shareReceipt = async (file: File, description: string) => {
    if (!canShareFiles) {
      console.warn("File sharing not supported");
      return false;
    }

    return share({
      title: "Receipt",
      text: description,
      files: [file]
    });
  };

  return {
    share,
    shareTrip,
    shareInvite,
    shareReceipt,
    isSupported,
    canShareFiles
  };
}
