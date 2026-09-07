import { PageTitle } from '@/components/PageTitle';
import FileApp from '@/components/file/FileApp';

export const FilesPage = () => {
  return (
    <div className="space-y-6">
      <PageTitle
        title="系統檔案"
        items={[
          { label: '內容管理', path: '/content/files' },
          { label: '系統檔案', active: true },
        ]}
      />
      <FileApp />
    </div>
  );
};
