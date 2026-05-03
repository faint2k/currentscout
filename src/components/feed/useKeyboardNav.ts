import { useEffect, useCallback } from "react";
import type { RankedPost } from "../../lib/reddit/types";
import { redditUrl } from "../../lib/utils/format";

interface UseKeyboardNavOptions {
  posts: RankedPost[];
  activeIndex: number | null;
  setActiveIndex: (i: number | null) => void;
  onOpenModal: (post: RankedPost) => void;
  onCloseModal: () => void;
  modalOpen: boolean;
}

export function useKeyboardNav({
  posts,
  activeIndex,
  setActiveIndex,
  onOpenModal,
  onCloseModal,
  modalOpen,
}: UseKeyboardNavOptions) {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      // Don't fire when user is typing in an input/textarea/select
      const tag = (e.target as HTMLElement).tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;

      switch (e.key) {
        case "j": {
          e.preventDefault();
          setActiveIndex(
            activeIndex === null ? 0 : Math.min(activeIndex + 1, posts.length - 1)
          );
          break;
        }
        case "k": {
          e.preventDefault();
          setActiveIndex(
            activeIndex === null ? 0 : Math.max(activeIndex - 1, 0)
          );
          break;
        }
        case "Enter": {
          if (activeIndex !== null && !modalOpen) {
            e.preventDefault();
            onOpenModal(posts[activeIndex]);
          }
          break;
        }
        case "o": {
          if (activeIndex !== null) {
            e.preventDefault();
            const post = posts[activeIndex];
            const url = post.is_self ? redditUrl(post.permalink) : post.url;
            window.open(url, "_blank", "noopener,noreferrer");
          }
          break;
        }
        case "Escape": {
          if (modalOpen) {
            onCloseModal();
          } else {
            setActiveIndex(null);
          }
          break;
        }
      }
    },
    [activeIndex, posts, modalOpen, setActiveIndex, onOpenModal, onCloseModal]
  );

  useEffect(() => {
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handler]);
}
