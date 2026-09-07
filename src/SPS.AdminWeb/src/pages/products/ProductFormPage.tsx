import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { FilePickerModal } from '@/components/shared/FilePickerModal';
import { productApi } from '@/lib/api/product';
import { picturesApi } from '@/lib/api/pictures';
import { companiesApi } from '@/lib/api/companies';
import { categoriesApi } from '@/lib/api/category';
import type {
  CreateProductRequest,
  UpdateProductRequest,
  LengthUnit,
  WeightUnit,
} from '@/types/product';
import type { PictureResponse } from '@/types/picture';
import type { Company } from '@/types/company';
import type { FileListItem, FileUploadResponse } from '@/types/files';
import { SearchableSelect } from '@/components/shared/SearchableSelect';
import { useNotify } from '@/hooks/useNotify';
import {formatApiPath} from "@/lib/fix-weburl.ts";

interface CategoryOption {
  id: number;
  name: string;
}

export const ProductFormPage = () => {
  const notify = useNotify();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = id !== undefined && id !== 'create';

  // Form data
  const [name, setName] = useState('');
  const [modelNo, setModelNo] = useState('');
  const [unit, setUnit] = useState('');
  const [mixed, setMixed] = useState(false);
  const [published, setPublished] = useState(false);
  const [introduction, setIntroduction] = useState('');
  const [remark, setRemark] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();

  // Dimensions
  const [lengthUnit, setLengthUnit] = useState<LengthUnit | undefined>();
  const [height, setHeight] = useState<number | undefined>();
  const [width, setWidth] = useState<number | undefined>();
  const [depth, setDepth] = useState<number | undefined>();

  // Weights
  const [weightUnit, setWeightUnit] = useState<WeightUnit | undefined>();
  const [netWeight, setNetWeight] = useState<number | undefined>();
  const [grossWeight, setGrossWeight] = useState<number | undefined>();
  const [conditionedWeight, setConditionedWeight] = useState<number | undefined>();

  // Cover image
  const [coverId, setCoverId] = useState<number | undefined>();
  const [existingCover, setExistingCover] = useState<PictureResponse | undefined>();
  const [removeCover, setRemoveCover] = useState(false);
  const [isCoverPickerOpen, setIsCoverPickerOpen] = useState(false);

  // Pictures
  const [pictureIds, setPictureIds] = useState<number[]>([]);
  const [existingPictures, setExistingPictures] = useState<PictureResponse[]>([]);
  const [isPicturesPickerOpen, setIsPicturesPickerOpen] = useState(false);

  // Files
  const [fileIds, setFileIds] = useState<string[]>([]);
  const [existingFiles, setExistingFiles] = useState<{ id: string; name: string }[]>([]);
  const [isFilesPickerOpen, setIsFilesPickerOpen] = useState(false);

  // Options
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);

  // Load companies and categories
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [companiesRes, categoriesRes] = await Promise.all([
          companiesApi.getCompanies(1, 100),
          categoriesApi.getCategoriesByType(1), // product category type
        ]);
        setCompanies(companiesRes.items);
        setCategories(categoriesRes.map((c) => ({ id: c.id, name: c.name ?? '' })));
      } catch (error) {
        console.error('Failed to load options:', error);
      }
    };
    loadOptions();
  }, []);

  // Load existing product
  useEffect(() => {
    if (!isEditMode) return;
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const data = await productApi.getById(Number(id));
        setName(data.name);
        setModelNo(data.modelNo || '');
        setUnit(data.unit || '');
        setMixed(data.mixed);
        setPublished(data.published);
        setIntroduction(data.introduction || '');
        setRemark(data.remark || '');
        setCompanyId(data.companyId || '');
        setCategoryId(data.categoryId);
        setLengthUnit(data.lengthUnit);
        setHeight(data.height);
        setWidth(data.width);
        setDepth(data.depth);
        setWeightUnit(data.weightUnit);
        setNetWeight(data.netWeight);
        setGrossWeight(data.grossWeight);
        setConditionedWeight(data.conditionedWeight);
        if (data.cover) {
          setExistingCover(data.cover);
          setCoverId(data.cover.id);
        }
        if (data.pictures) {
          setExistingPictures(data.pictures);
          setPictureIds(data.pictures.map((p) => p.id));
        }
        if (data.files) {
          setExistingFiles(data.files.map((f) => ({ id: f.id, name: f.originalFileName })));
          setFileIds(data.files.map((f) => f.id));
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
        await notify.error('載入產品資料失敗');
        navigate('/products');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id, isEditMode, navigate]);

  const handleCoverSelect = async (file: FileListItem | FileUploadResponse) => {
    try {
      const fileUrl = 'fileUrl' in file ? file.fileUrl : `/api/FileManagement/${file.id}/download`;
      const picture = await picturesApi.create({
        name: 'originalFileName' in file ? file.originalFileName : file.fileName,
        type: 0,
        contentType: file.contentType,
        uri: fileUrl,
        published: true,
        ordinal: 0,
        height: 0,
        width: 0,
        dpi: 0,
      });
      setCoverId(picture.id);
      setExistingCover(picture);
      setRemoveCover(false);
    } catch (error) {
      console.error('Failed to create cover picture:', error);
      await notify.error('上傳封面圖片失敗');
    }
    setIsCoverPickerOpen(false);
  };

  const handlePictureSelect = async (file: FileListItem | FileUploadResponse) => {
    try {
      const fileUrl = 'fileUrl' in file ? file.fileUrl : `/api/FileManagement/${file.id}/download`;
      const picture = await picturesApi.create({
        name: 'originalFileName' in file ? file.originalFileName : file.fileName,
        type: 0,
        contentType: file.contentType,
        uri: fileUrl,
        published: true,
        ordinal: 0,
        height: 0,
        width: 0,
        dpi: 0,
      });
      setPictureIds((prev) => [...prev, picture.id]);
      setExistingPictures((prev) => [...prev, picture]);
    } catch (error) {
      console.error('Failed to create picture:', error);
      await notify.error('上傳圖片失敗');
    }
    setIsPicturesPickerOpen(false);
  };

  const handleFileSelect = (file: FileListItem | FileUploadResponse) => {
    const fileId = 'fileId' in file ? file.fileId : file.id;
    const fileName = 'originalFileName' in file ? file.originalFileName : file.fileName;
    if (!fileIds.includes(fileId)) {
      setFileIds((prev) => [...prev, fileId]);
      setExistingFiles((prev) => [...prev, { id: fileId, name: fileName }]);
    }
    setIsFilesPickerOpen(false);
  };

  const removePicture = (pictureId: number) => {
    setPictureIds((prev) => prev.filter((id) => id !== pictureId));
    setExistingPictures((prev) => prev.filter((p) => p.id !== pictureId));
  };

  const removeFile = (fId: string) => {
    setFileIds((prev) => prev.filter((id) => id !== fId));
    setExistingFiles((prev) => prev.filter((f) => f.id !== fId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      await notify.warning('請輸入產品名稱');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode) {
        const updateData: UpdateProductRequest = {
          name,
          modelNo: modelNo || undefined,
          unit: unit || undefined,
          mixed,
          published,
          introduction: introduction || undefined,
          remark: remark || undefined,
          categoryId,
          lengthUnit,
          height,
          width,
          depth,
          weightUnit,
          netWeight,
          grossWeight,
          conditionedWeight,
          coverId,
          removeCover,
          pictureIds,
          fileIds,
        };
        await productApi.update(Number(id), updateData);
      } else {
        const createData: CreateProductRequest = {
          name,
          modelNo: modelNo || undefined,
          unit: unit || undefined,
          mixed,
          published,
          introduction: introduction || undefined,
          remark: remark || undefined,
          companyId: companyId || undefined,
          categoryId,
          lengthUnit,
          height,
          width,
          depth,
          weightUnit,
          netWeight,
          grossWeight,
          conditionedWeight,
          coverId,
          pictureIds,
          fileIds,
        };
        await productApi.create(createData);
      }
      navigate('/products');
    } catch (error) {
      console.error('Failed to save product:', error);
      await notify.error('儲存產品資料失敗，請稍後再試');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        {notify.NotifyComponent}
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title={isEditMode ? '編輯產品' : '新增產品'}
        items={[
          { label: '產品管理', path: '/products' },
          { label: isEditMode ? '編輯' : '新增', active: true },
        ]}
      />

      <div className="flex gap-4">
        <button onClick={() => navigate(-1)} className="btn btn-ghost">
          <span className="iconify lucide--arrow-left size-4" />
          返回
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: main info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-6">
                  <span className="iconify lucide--package size-6" />
                  基本資訊
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control md:col-span-2">
                    <label className="label">
                      <span className="label-text font-medium">產品名稱 <span className="text-error">*</span></span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">型號</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={modelNo}
                      onChange={(e) => setModelNo(e.target.value)}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">單位</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="例：件、組、台"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-3">
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={mixed}
                        onChange={(e) => setMixed(e.target.checked)}
                      />
                      <span className="label-text font-medium">混合產品</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Dimensions */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-6">
                  <span className="iconify lucide--ruler size-6" />
                  尺寸
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">長度單位</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={lengthUnit ?? ''}
                      onChange={(e) => setLengthUnit(e.target.value === '' ? undefined : Number(e.target.value) as LengthUnit)}
                    >
                      <option value="">不設定</option>
                      <option value={0}>mm</option>
                      <option value={1}>cm</option>
                      <option value={2}>m</option>
                      <option value={3}>in</option>
                      <option value={4}>ft</option>
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">高度</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      className="input input-bordered"
                      value={height ?? ''}
                      onChange={(e) => setHeight(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">寬度</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      className="input input-bordered"
                      value={width ?? ''}
                      onChange={(e) => setWidth(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">深度</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      className="input input-bordered"
                      value={depth ?? ''}
                      onChange={(e) => setDepth(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Weights */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-6">
                  <span className="iconify lucide--weight size-6" />
                  重量
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">重量單位</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={weightUnit ?? ''}
                      onChange={(e) => setWeightUnit(e.target.value === '' ? undefined : Number(e.target.value) as WeightUnit)}
                    >
                      <option value="">不設定</option>
                      <option value={0}>g</option>
                      <option value={1}>kg</option>
                      <option value={2}>t</option>
                      <option value={3}>lb</option>
                      <option value={4}>oz</option>
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">淨重</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      className="input input-bordered"
                      value={netWeight ?? ''}
                      onChange={(e) => setNetWeight(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">毛重</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      className="input input-bordered"
                      value={grossWeight ?? ''}
                      onChange={(e) => setGrossWeight(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">條件重量</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      className="input input-bordered"
                      value={conditionedWeight ?? ''}
                      onChange={(e) => setConditionedWeight(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Introduction & Remark */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-6">
                  <span className="iconify lucide--file-text size-6" />
                  詳細介紹
                </h2>
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">產品介紹</span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered h-32"
                      value={introduction}
                      onChange={(e) => setIntroduction(e.target.value)}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">備註</span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered h-24"
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Company & Category */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-6">
                  <span className="iconify lucide--settings size-6" />
                  分類與設定
                </h2>
                <div className="space-y-4">
                  {!isEditMode && (
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">所屬公司</span>
                      </label>
                      <SearchableSelect
                        options={companies.map((c) => ({ value: c.id, label: c.name }))}
                        value={companyId}
                        onChange={setCompanyId}
                        placeholder="輸入公司名稱搜尋..."
                        emptyLabel="不指定"
                      />
                    </div>
                  )}

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">產品分類</span>
                    </label>
                    <select
                      className="select select-bordered w-full"
                      value={categoryId ?? ''}
                      onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                    >
                      <option value="">不指定</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-3">
                      <input
                        type="checkbox"
                        className="toggle toggle-success"
                        checked={published}
                        onChange={(e) => setPublished(e.target.checked)}
                      />
                      <span className="label-text font-medium">發布產品</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Cover image */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-4">
                  <span className="iconify lucide--image size-6" />
                  封面圖片
                </h2>
                {existingCover && !removeCover ? (
                  <div className="space-y-3">
                    <img
                      src={formatApiPath(existingCover.uri) || ''}
                      alt="封面圖片"
                      className="w-full h-32 object-contain rounded-lg bg-base-200"
                    />
                    <button
                      type="button"
                      className="btn btn-error btn-sm btn-block"
                      onClick={() => {
                        setRemoveCover(true);
                        setExistingCover(undefined);
                        setCoverId(undefined);
                      }}
                    >
                      <span className="iconify lucide--trash-2 size-4" />
                      移除封面
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn btn-outline btn-block"
                    onClick={() => setIsCoverPickerOpen(true)}
                  >
                    <span className="iconify lucide--upload size-4" />
                    選擇封面圖片
                  </button>
                )}
              </div>
            </div>

            {/* Product pictures */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-4">
                  <span className="iconify lucide--images size-6" />
                  產品圖片 ({existingPictures.length})
                </h2>
                {existingPictures.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {existingPictures.map((pic) => (
                      <div key={pic.id} className="relative group">
                        <img
                          src={formatApiPath(pic.uri) || ''}
                          alt={pic.name || ''}
                          className="w-full h-20 object-cover rounded-lg bg-base-200"
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 btn btn-error btn-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removePicture(pic.id)}
                        >
                          <span className="iconify lucide--x size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  className="btn btn-outline btn-block btn-sm"
                  onClick={() => setIsPicturesPickerOpen(true)}
                >
                  <span className="iconify lucide--plus size-4" />
                  新增圖片
                </button>
              </div>
            </div>

            {/* Product files */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-4">
                  <span className="iconify lucide--paperclip size-6" />
                  產品文件 ({existingFiles.length})
                </h2>
                {existingFiles.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {existingFiles.map((f) => (
                      <div key={f.id} className="flex items-center gap-2 p-2 bg-base-200 rounded">
                        <span className="iconify lucide--file size-4" />
                        <span className="text-sm flex-1 truncate">{f.name}</span>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() => removeFile(f.id)}
                        >
                          <span className="iconify lucide--x size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  className="btn btn-outline btn-block btn-sm"
                  onClick={() => setIsFilesPickerOpen(true)}
                >
                  <span className="iconify lucide--plus size-4" />
                  新增文件
                </button>
              </div>
            </div>

            {/* Save / Cancel */}
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <>
                    <span className="iconify lucide--save size-5" />
                    儲存產品
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-ghost btn-block"
                disabled={isSaving}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      </form>

      <FilePickerModal
        isOpen={isCoverPickerOpen}
        onClose={() => setIsCoverPickerOpen(false)}
        onSelect={handleCoverSelect}
        fileType="image"
        title="選擇封面圖片"
      />

      <FilePickerModal
        isOpen={isPicturesPickerOpen}
        onClose={() => setIsPicturesPickerOpen(false)}
        onSelect={handlePictureSelect}
        fileType="image"
        title="新增產品圖片"
      />

      <FilePickerModal
        isOpen={isFilesPickerOpen}
        onClose={() => setIsFilesPickerOpen(false)}
        onSelect={handleFileSelect}
        title="新增產品文件"
      />
    </div>
  );
};
