import React from 'react';
import { audioHelper } from '../../utils/audioHelper';

interface SidebarCategoriesProps {
  categories: { id: string; name: string }[];
  selected: string;
  onSelect: (id: string) => void;
}

const SidebarCategories: React.FC<SidebarCategoriesProps> = ({ categories, selected, onSelect }) => (
  <aside className="vertical-category-panel">
    <h3 style={{ marginTop: 0, color: 'var(--morado-primario)', marginBottom: 16 }}>📂 Categorías</h3>
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {categories.map(cat => (
        <li key={cat.id}>
          <button
            className={selected === cat.id ? 'active' : ''}
            onClick={() => {
              onSelect(cat.id);
              audioHelper.playClickCategory();
            }}
          >
            {cat.name}
          </button>
        </li>
      ))}
    </ul>
  </aside>
);

export default SidebarCategories;
