interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
}: PaginationProps) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = 5; // 顯示的頁碼數量

    if (totalPages <= showPages) {
      // 如果總頁數小於等於顯示數量，顯示所有頁碼
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 總是顯示第一頁
      pages.push(1);

      // 計算中間頁碼
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // 如果當前頁靠近開始
      if (currentPage <= 3) {
        end = 4;
      }

      // 如果當前頁靠近結束
      if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }

      // 添加省略號
      if (start > 2) {
        pages.push('...');
      }

      // 添加中間頁碼
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // 添加省略號
      if (end < totalPages - 1) {
        pages.push('...');
      }

      // 總是顯示最後一頁
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex justify-center">
      <div className="join">
        <button
          className="join-item btn btn-sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
        >
          <span className="iconify lucide--chevron-left size-4" />
        </button>

        {getPageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <button key={`ellipsis-${index}`} className="join-item btn btn-sm btn-disabled">
                ...
              </button>
            );
          }

          return (
            <button
              key={page}
              className={`join-item btn btn-sm ${page === currentPage ? 'btn-active' : ''}`}
              onClick={() => onPageChange(page as number)}
              disabled={isLoading}
            >
              {page}
            </button>
          );
        })}

        <button
          className="join-item btn btn-sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
        >
          <span className="iconify lucide--chevron-right size-4" />
        </button>
      </div>
    </div>
  );
};
