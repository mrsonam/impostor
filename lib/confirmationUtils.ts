import { useConfirmationModal } from './useConfirmationModal';

// Utility functions for common confirmation scenarios
export const useConfirmations = () => {
  const { openModal } = useConfirmationModal();

  const confirmDelete = async (itemName: string = "this item") => {
    return await openModal({
      title: "Confirm Deletion",
      message: `Are you sure you want to delete ${itemName}? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger"
    });
  };

  const confirmLeave = async (message: string = "You will lose your progress if you leave now.") => {
    return await openModal({
      title: "Leave Confirmation",
      message,
      confirmText: "Leave",
      cancelText: "Stay",
      type: "warning"
    });
  };

  const confirmAction = async (title: string, message: string, confirmText: string = "Confirm") => {
    return await openModal({
      title,
      message,
      confirmText,
      cancelText: "Cancel",
      type: "info"
    });
  };

  const confirmGameEnd = async () => {
    return await openModal({
      title: "End Game",
      message: "Are you sure you want to end the current game? All progress will be lost.",
      confirmText: "End Game",
      cancelText: "Continue Playing",
      type: "warning"
    });
  };

  const confirmRoomLeave = async () => {
    return await openModal({
      title: "Leave Room",
      message: "Are you sure you want to leave this room? You will need to rejoin if you want to play again.",
      confirmText: "Leave Room",
      cancelText: "Stay",
      type: "warning"
    });
  };

  const confirmPlayerKick = async (playerName: string) => {
    return await openModal({
      title: "Remove Player",
      message: `Are you sure you want to remove ${playerName} from the room?`,
      confirmText: "Remove",
      cancelText: "Cancel",
      type: "warning"
    });
  };

  return {
    confirmDelete,
    confirmLeave,
    confirmAction,
    confirmGameEnd,
    confirmRoomLeave,
    confirmPlayerKick
  };
};
