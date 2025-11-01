// FIX: Changed import path to '@firebase/firestore' to resolve module not found error.
import { deleteDoc, doc } from "@firebase/firestore";
import { db } from "../firebase/config";
import { toast } from "react-toastify";

interface DeleteOptions {
  collectionName: string;
  id: string;
  onSuccess?: () => void;
  recalcTotals?: () => Promise<void>;
  confirmMessage?: string;
}

export const handleDelete = async ({
  collectionName,
  id,
  onSuccess,
  recalcTotals,
  confirmMessage = "Are you sure you want to delete this item?",
}: DeleteOptions) => {
  const confirmed = window.confirm(confirmMessage);
  if (!confirmed) return;

  try {
    await deleteDoc(doc(db, collectionName, id));
    toast.success("Deleted successfully!");

    if (recalcTotals) await recalcTotals();
    if (onSuccess) onSuccess();
  } catch (error) {
    console.error("Delete Error:", error);
    toast.error("Failed to delete item!");
  }
};
