import { useSelector, useDispatch } from 'react-redux';
import { useCallback } from 'react';
import { RootState, entitiesActions } from '~/store';
import { selectTags } from '~/store/selectors';
import { tagApiService } from '~/api/tag.api';
import { Tag, TagOption } from '~/types/tag.types';

export const useTags = () => {
  const dispatch = useDispatch();

  const tags = useSelector(selectTags);
  const loading = false;
  const error = null;

  const clearError = useCallback(() => {}, [dispatch]);

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

  const getOptions = useCallback(async (tagId: string): Promise<TagOption[]> => {
    try {
      return await tagApiService.getOptions(tagId);
    } catch (err) {
      throw err;
    }
  }, []);

  const createOption = useCallback(async (tagId: string, data: Partial<TagOption>): Promise<TagOption> => {
    try {
      const newOption = await tagApiService.createOption(tagId, data);
      // WebSocket mettra à jour automatiquement le tag
      return newOption;
    } catch (err) {
      throw err;
    }
  }, []);

  const bulkCreateOptions = useCallback(async (tagId: string, options: Partial<TagOption>[]): Promise<TagOption[]> => {
    try {
      const newOptions = await tagApiService.bulkCreateOptions(tagId, options);
      // WebSocket mettra à jour automatiquement le tag
      return newOptions;
    } catch (err) {
      throw err;
    }
  }, []);

  const updateOption = useCallback(async (tagId: string, optionId: string, data: Partial<TagOption>): Promise<TagOption> => {
    try {
      const updatedOption = await tagApiService.updateOption(tagId, optionId, data);
      // WebSocket mettra à jour automatiquement le tag
      return updatedOption;
    } catch (err) {
      throw err;
    }
  }, []);

  const deleteOption = useCallback(async (tagId: string, optionId: string): Promise<void> => {
    try {
      await tagApiService.deleteOption(tagId, optionId);
      // WebSocket mettra à jour automatiquement le tag
    } catch (err) {
      throw err;
    }
  }, []);

  const bulkDeleteOptions = useCallback(async (tagId: string, optionIds: string[]): Promise<void> => {
    try {
      await tagApiService.bulkDeleteOptions(tagId, optionIds);
      // WebSocket mettra à jour automatiquement le tag
    } catch (err) {
      throw err;
    }
  }, []);

  return {
    tags,
    loading,
    error,
    clearError,
    createTag,
    updateTag,
    deleteTag,
    getOptions,
    createOption,
    bulkCreateOptions,
    updateOption,
    deleteOption,
    bulkDeleteOptions
  };
};
