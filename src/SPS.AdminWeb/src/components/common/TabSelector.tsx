interface TabItem<T extends string | number> {
  value: T;
  label: string;
  icon?: string;
}

interface TabSelectorProps<T extends string | number> {
  tabs: TabItem<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
}

export const TabSelector = <T extends string | number>({
  tabs,
  activeTab,
  onTabChange,
}: TabSelectorProps<T>) => {
  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body py-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              className={`btn btn-sm ${activeTab === tab.value ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => onTabChange(tab.value)}
            >
              {tab.icon && <span className={`iconify ${tab.icon} size-4`} />}
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
