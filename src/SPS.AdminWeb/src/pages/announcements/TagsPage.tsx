import { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { PageTitle } from '@/components/PageTitle';
import { tagsApi } from '@/lib/api/tags';
import { TagType, type Tag } from '@/types/taxonomy';
import { useConfirm } from '@/hooks/useConfirm';
import { useNotify } from '@/hooks/useNotify';

const PAGE_SIZE = 20;

function errorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
  }
  return fallback;
}

interface TagFormData {
  name: string;
  ordinal: number;
}

/**
 * 公告標籤管理。標籤是公告卡片上的藍色關鍵字（跟紫色的「分類」是兩層，見
 * docs/改版規劃.md），管理員在這裡維護標籤清單，再到公告表單替每篇公告勾選。
 * 標籤名稱在後端同一分類內要唯一；仍被公告使用的標籤後端會拒絕刪除，
 * 這裡直接顯示後端回的原因。
 */
export const AnnouncementTagsPage = () => {
  const notify = useNotify();
  const { confirmDialog, ConfirmComponent } = useConfirm();
  const [tags, setTags] = useState<Tag[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<TagFormData>({ name: '', ordinal: 0 });

  const fetchTags = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await tagsApi.getPaged({
        type: TagType.News,
        name: appliedKeyword || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setTags(result.items);
      setTotalCount(result.totalCount);
    } catch (err) {
      notify.error(errorMessage(err, '載入標籤失敗'));
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedKeyword, page]);

  useEffect(() => {
    void fetchTags();
  }, [fetchTags]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const openModal = (tag?: Tag) => {
    setEditing(tag ?? null);
    setFormData(tag ? { name: tag.name, ordinal: tag.ordinal } : { name: '', ordinal: 0 });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = formData.name.trim();
    if (!name) {
      notify.warning('請輸入標籤名稱');
      return;
    }

    setIsSaving(true);
    try {
      if (editing) {
        await tagsApi.updateTag(editing.id, { name, ordinal: formData.ordinal });
      } else {
        await tagsApi.createTag({ type: TagType.News, name, ordinal: formData.ordinal });
      }
      closeModal();
      await fetchTags();
    } catch (err) {
      notify.error(errorMessage(err, '儲存標籤失敗'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (tag: Tag) => {
    const confirmed = await confirmDialog({
      cardTitle: '刪除標籤',
      message: `確定要刪除標籤「${tag.name}」嗎？`,
      buttonConfirm: '刪除',
      confirmStyle: 'bg-error',
    });
    if (!confirmed) return;

    try {
      await tagsApi.deleteTag(tag.id);
      // 刪掉本頁最後一筆時退回上一頁，避免停在空白頁
      if (tags.length === 1 && page > 1) setPage(page - 1);
      else await fetchTags();
    } catch (err) {
      notify.error(errorMessage(err, '刪除標籤失敗'));
    }
  };

  return (
    <>
      <div className="space-y-6">
        <PageTitle
          title="公告標籤"
          items={[
            { label: '公告管理', path: '/announcements' },
            { label: '標籤管理', active: true },
          ]}
        />

        <div className="flex flex-wrap justify-between items-center gap-3">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setAppliedKeyword(keyword.trim());
            }}
          >
            <input
              type="text"
              className="input input-bordered input-sm"
              placeholder="搜尋標籤名稱"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button type="submit" className="btn btn-sm">
              <span className="iconify lucide--search size-4" />
              搜尋
            </button>
          </form>
          <button onClick={() => openModal()} className="btn btn-success">
            <span className="iconify lucide--plus size-5" />
            新增標籤
          </button>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg" />
              </div>
            ) : tags.length === 0 ? (
              <div className="text-center py-12 text-base-content/60">
                <span className="iconify lucide--tags size-16 mb-4" />
                <p>{appliedKeyword ? '找不到符合的標籤' : '尚未建立任何公告標籤'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>標籤名稱</th>
                      <th>使用中公告數</th>
                      <th>排序</th>
                      <th>建立時間</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tags.map((tag) => (
                      <tr key={tag.id}>
                        <td>
                          <span className="badge badge-info badge-outline">{tag.name}</span>
                        </td>
                        <td>{tag.usageCount}</td>
                        <td>{tag.ordinal}</td>
                        <td className="text-sm text-base-content/70">
                          {new Date(tag.createdTime).toLocaleDateString('zh-TW')}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button onClick={() => openModal(tag)} className="btn btn-ghost btn-sm">
                              <span className="iconify lucide--edit size-4" />
                              編輯
                            </button>
                            <button
                              onClick={() => void handleDelete(tag)}
                              className="btn btn-ghost btn-sm text-error"
                              title={tag.usageCount > 0 ? '仍有公告使用中，無法刪除' : undefined}
                            >
                              <span className="iconify lucide--trash-2 size-4" />
                              刪除
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-base-content/60">
                  共 {totalCount} 個標籤，第 {page} / {totalPages} 頁
                </span>
                <div className="join">
                  <button className="join-item btn btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    上一頁
                  </button>
                  <button className="join-item btn btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    下一頁
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {isModalOpen && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">{editing ? '編輯標籤' : '新增標籤'}</h3>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        標籤名稱 <span className="text-error">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      placeholder="例如：智慧工安"
                      maxLength={100}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">排序</span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered"
                      value={formData.ordinal}
                      onChange={(e) => setFormData({ ...formData, ordinal: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="modal-action">
                  <button type="button" onClick={closeModal} className="btn btn-ghost" disabled={isSaving}>
                    取消
                  </button>
                  <button type="submit" className="btn btn-success" disabled={isSaving}>
                    {isSaving ? <span className="loading loading-spinner loading-sm" /> : editing ? '儲存' : '新增'}
                  </button>
                </div>
              </form>
            </div>
            <div className="modal-backdrop" onClick={closeModal} />
          </div>
        )}
      </div>
      {ConfirmComponent}
      {notify.NotifyComponent}
    </>
  );
};
