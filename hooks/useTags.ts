import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { entitiesActions } from '~/store';
import { selectTags } from '~/store/selectors';
import { tagApiService } from '~/api/tag.api';
import { Tag } from '~/types/tag.types';

export const useTags = () => {
  const dispatch = useDispatch();

  const tags: Tag[] = useSelector(selectTags);

  const createTag = useCallback(async (data: Partial<Tag>): Promise<Tag> => {
    try {
      const newTag = await tagApiService.create(data);
      dispatch(entitiesActions.createTag({ tag: newTag }));
      return newTag;
    } catch (err) {
      throw err;
    }
  }, [dispatch]);

  const updateTag = useCallback(async (id: string, data: Partial<Tag>): Promise<Tag> => {
    try {
      const updatedTag = await tagApiService.update(id, data);
      dispatch(entitiesActions.updateTag({ tag: updatedTag }));
      return updatedTag;
    } catch (err) {
      throw err;
    }
  }, [dispatch]);

  const deleteTag = useCallback(async (id: string): Promise<void> => {
    try {
      await tagApiService.delete(id);
      dispatch(entitiesActions.deleteTag({ tagId: id }));
    } catch (err) {
      throw err;
    }
  }, [dispatch]);

  return {
    tags,
    createTag,
    updateTag,
    deleteTag,
  };
};
