import { useUpdatePost } from '@/hooks/posts';
import { UpdatePostBody } from '@lib';
import { createContext, useContext, useState } from 'react';

interface EditPostContextValue {
  postId: string | undefined;
  startEdit: (postId: string) => void;
  cancelEdit: () => void;
  saveEdit: (data: UpdatePostBody) => Promise<void>;
}

const EditPostContext = createContext<EditPostContextValue | null>(null);

export const EditPostProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [currentPostId, setCurrentPostId] = useState<string | undefined>(
    undefined,
  );

  const startEdit = (postId: string) => {
    if (currentPostId) {
      console.warn('already editing post');
      return;
    }

    setCurrentPostId(postId);
  };

  const cancelEdit = () => {
    if (!currentPostId) {
      console.warn('was not editing');
      return;
    }

    setCurrentPostId(undefined);
  };

  const updatePost = useUpdatePost({
    onSettled: () => {
      setCurrentPostId(undefined);
    },
  });

  const saveEdit = async (data: UpdatePostBody) => {
    if (!currentPostId) {
      console.warn('post id not set... cancelling');
      return;
    }

    await updatePost({ postId: currentPostId, data });
  };

  return (
    <EditPostContext
      value={{
        postId: currentPostId,
        startEdit,
        cancelEdit,
        saveEdit,
      }}
    >
      {children}
    </EditPostContext>
  );
};

export const useEditPost = () => {
  const context = useContext(EditPostContext);

  if (!context) {
    throw new Error('cannot use edit post context outside of provider');
  }

  return context;
};
