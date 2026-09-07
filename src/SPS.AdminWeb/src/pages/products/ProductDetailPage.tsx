import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { productApi } from '@/lib/api/product';
import type { ProductResponse } from '@/types/product';
import {formatApiPath} from "@/lib/fix-weburl.ts";

const lengthUnitLabels: Record<number, string> = {
  0: 'mm',
  1: 'cm',
  2: 'm',
  3: 'in',
  4: 'ft',
};

const weightUnitLabels: Record<number, string> = {
  0: 'g',
  1: 'kg',
  2: 't',
  3: 'lb',
  4: 'oz',
};

export const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const data = await productApi.getById(Number(id));
        setProduct(data);
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-TW');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <span className="iconify lucide--package-x size-16 mb-4 text-base-content/40" />
        <p className="text-lg text-base-content/60">產品不存在</p>
        <button onClick={() => navigate('/products')} className="btn btn-primary mt-4">
          返回列表
        </button>
      </div>
    );
  }

  const lengthUnit = product.lengthUnit != null ? lengthUnitLabels[product.lengthUnit] : '';
  const weightUnit = product.weightUnit != null ? weightUnitLabels[product.weightUnit] : '';

  return (
    <div className="space-y-6">
      <PageTitle
        title="產品詳情"
        items={[
          { label: '產品管理', path: '/products' },
          { label: '詳情', active: true },
        ]}
      />

      <div className="flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="btn btn-ghost">
          <span className="iconify lucide--arrow-left size-4" />
          返回
        </button>
        <button
          onClick={() => navigate(`/products/${id}/edit`)}
          className="btn btn-primary"
        >
          <span className="iconify lucide--edit size-4" />
          編輯產品
        </button>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              {product.cover?.uri ? (
                <img
                  src={formatApiPath(product.cover.uri)}
                  alt={product.name}
                  className="w-20 h-20 object-cover rounded-lg bg-base-200"
                />
              ) : (
                <div className="w-20 h-20 bg-base-200 rounded-lg flex items-center justify-center">
                  <span className="iconify lucide--package size-10 text-base-content/40" />
                </div>
              )}
              <div>
                <h2 className="card-title text-2xl mb-1">{product.name}</h2>
                <p className="text-sm text-base-content/60">產品編號: {product.number}</p>
                {product.modelNo && (
                  <p className="text-sm text-base-content/60">型號: {product.modelNo}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {product.published ? (
                <span className="badge badge-success">已發布</span>
              ) : (
                <span className="badge badge-ghost">草稿</span>
              )}
              {product.mixed && (
                <span className="badge badge-info">混合產品</span>
              )}
            </div>
          </div>

          <div className="grid gap-6">
            {/* 基本資訊 */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="iconify lucide--info size-5" />
                基本資訊
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">所屬公司</span>
                  </label>
                  <p className="text-base-content">{product.companyName || '-'}</p>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">單位</span>
                  </label>
                  <p className="text-base-content">{product.unit || '-'}</p>
                </div>
              </div>
            </div>

            {/* 尺寸與重量 */}
            {(product.height || product.width || product.depth || product.netWeight || product.grossWeight) && (
              <>
                <div className="divider" />
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="iconify lucide--ruler size-5" />
                    尺寸與重量
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {product.height != null && (
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">高度</span>
                        </label>
                        <p className="text-base-content">{product.height} {lengthUnit}</p>
                      </div>
                    )}
                    {product.width != null && (
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">寬度</span>
                        </label>
                        <p className="text-base-content">{product.width} {lengthUnit}</p>
                      </div>
                    )}
                    {product.depth != null && (
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">深度</span>
                        </label>
                        <p className="text-base-content">{product.depth} {lengthUnit}</p>
                      </div>
                    )}
                    {product.netWeight != null && (
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">淨重</span>
                        </label>
                        <p className="text-base-content">{product.netWeight} {weightUnit}</p>
                      </div>
                    )}
                    {product.grossWeight != null && (
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">毛重</span>
                        </label>
                        <p className="text-base-content">{product.grossWeight} {weightUnit}</p>
                      </div>
                    )}
                    {product.conditionedWeight != null && (
                      <div className="form-control">
                        <label className="label">
                          <span className="label-text font-medium">條件重量</span>
                        </label>
                        <p className="text-base-content">{product.conditionedWeight} {weightUnit}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* 產品介紹 */}
            {(product.introduction || product.remark) && (
              <>
                <div className="divider" />
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="iconify lucide--file-text size-5" />
                    產品介紹
                  </h3>
                  {product.introduction && (
                    <div className="form-control mb-4">
                      <label className="label">
                        <span className="label-text font-medium">介紹</span>
                      </label>
                      <p className="text-base-content whitespace-pre-wrap">{product.introduction}</p>
                    </div>
                  )}
                  {product.remark && (
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-medium">備註</span>
                      </label>
                      <div className="alert alert-info">
                        <span className="iconify lucide--info size-5" />
                        <p>{product.remark}</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 產品圖片 */}
            {product.pictures && product.pictures.length > 0 && (
              <>
                <div className="divider" />
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="iconify lucide--images size-5" />
                    產品圖片 ({product.pictures.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {product.pictures.map((pic) => (
                      <img
                        key={pic.id}
                        src={formatApiPath(pic.uri) || ''}
                        alt={pic.name || '產品圖片'}
                        className="w-full h-32 object-cover rounded-lg bg-base-200"
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* 產品文件 */}
            {product.files && product.files.length > 0 && (
              <>
                <div className="divider" />
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="iconify lucide--paperclip size-5" />
                    產品文件 ({product.files.length})
                  </h3>
                  <div className="space-y-2">
                    {product.files.map((file) => (
                      <div key={file.id} className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                        <span className="iconify lucide--file size-5" />
                        <div className="flex-1">
                          <p className="font-medium">{file.originalFileName}</p>
                          <p className="text-xs text-base-content/60">{file.formattedFileSize}</p>
                        </div>
                        {file.fileUrl && (
                          <a
                            href={file.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-sm"
                          >
                            <span className="iconify lucide--download size-4" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="divider" />

            {/* 系統資訊 */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="iconify lucide--clock size-5" />
                系統資訊
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">建立時間</span>
                  </label>
                  <p className="text-sm text-base-content/70">{formatDateTime(product.createdTime)}</p>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">最後更新</span>
                  </label>
                  <p className="text-sm text-base-content/70">{formatDateTime(product.updatedTime)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
