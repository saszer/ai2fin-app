This plan consolidates 19+ fragmented category implementations into a unified, high-performance system with centralized state management.

### **Phase 1: Core Architecture (Unified Components & State)**

1.  **Create `CategoryContext` Provider**
    *   **Goal:** Centralize fetching, caching, and state management to eliminate duplicate API calls and ensure consistency.
    *   **Features:**
        *   Global `categories` and `categorySets` state
        *   Shared `loading` and `error` states
        *   `refreshCategories()` and `refreshSets()` methods
        *   Optimistic updates for mutations
        *   Computed selectors (e.g., `activeCategories`, `groupedCategories`)
    *   **File:** `client/src/context/CategoryContext.tsx`

2.  **Create `CategoryBadge` Component**
    *   **Goal:** Unify visual display across tables, lists, and chips.
    *   **Features:**
        *   Consistent pastel colors (using `getCategoryDisplayColor`)
        *   Variants: `dot` (dot + text), `chip` (MUI Chip), `text` (colored text)
        *   Supports emoji and icons
        *   Handles "Uncategorized" state gracefully
    *   **File:** `client/src/components/unified/CategoryBadge.tsx`

3.  **Create `UnifiedCategorySelect` Component**
    *   **Goal:** The "One Dropdown to Rule Them All" - flexible, smart, and beautiful.
    *   **Design:**
        *   **Default:** Elegant flat list with 12px pastel dots + emojis.
        *   **Elite+ Upgrade:** Auto-detects sets and switches to grouped view with set headers.
        *   **Search:** Built-in fuzzy search (fuse.js or simple filter) for >10 items.
        *   **UX:** Keyboard navigation, "Create New" quick action, recent selections.
    *   **Props:** `value`, `onChange`, `multiple`, `showSets`, `variant` (standard/outlined/filled).
    *   **File:** `client/src/components/unified/UnifiedCategorySelect.tsx`

### **Phase 2: Migration & Cleanup**

4.  **Refactor Reusable Components**
    *   Replace `CategorySelect.tsx` logic to wrapper around `UnifiedCategorySelect`
    *   Replace `CategorySelector.tsx` logic
    *   Replace `CategorySetDropdown.tsx` logic
    *   (Keep `MultiCategorySelect` logic but render using unified internals)

5.  **Refactor Inline Implementations (Pages)**
    *   **Bills Page:** Replace inline selects in `EditBillComponent` and `CreateBillModal`.
    *   **Expenses Page:** Replace bulk edit dropdown and filter dropdowns.
    *   **Transactions Page:** Replace table cell dropdowns and filter chips.
    *   **Bank Transactions:** Replace convert dialog dropdowns.
    *   **Custom Rules:** Replace rule action dropdowns.

6.  **Fix Pastel Colors (Immediate Fix)**
    *   During refactoring, enforce `PASTEL_CATEGORY_COLORS` via `CategoryBadge` and `UnifiedCategorySelect`.
    *   Audit and replace any remaining hardcoded hex values in `ModernBillPatternCard` and `Tax` page.

### **Phase 3: Verification**

7.  **Audit & Polish**
    *   Verify correct set grouping for Elite vs Non-Elite users.
    *   Check keyboard accessibility.
    *   Verify caching prevents network waterfalls.
    *   Ensure all visual fallbacks use the pastel system.

### **Technical Specifications**

*   **State:** React Context + `useReducer` or simple state
*   **Styling:** MUI `sx` prop with theme integration
*   **Icons:** Lucide-React or MUI Icons
*   **Performance:** `React.memo` for list items, virtualized list for >100 categories
