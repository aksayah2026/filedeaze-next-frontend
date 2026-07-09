'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Plus, Pencil, Trash2, DollarSign, ChevronDown,
  Search, Tag, LayoutGrid, X, Layers,
} from 'lucide-react';
import api from '@/lib/axios';
import { ServiceCategory, ServiceSubCategory, Skill, SubCategorySkill } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { useRoleAccent } from '@/lib/useRoleAccent';
import { cn } from '@/lib/utils';

// ─── Form types (identical to existing pages) ─────────────────────────────────
type CatForm = { name: string; isActive: boolean };
type SubForm = { categoryId: string; name: string; isActive?: boolean };
type ChargesForm = { serviceCharge: number; inspectionCharge: number; emergencyCharge: number };

// ─── KPI Summary Card ────────────────────────────────────────────────────────
function KpiCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div
      className="flex-1 min-w-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 flex items-center gap-3"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <div
        className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${accent}18` }}
      >
        <Layers size={14} style={{ color: accent }} />
      </div>
      <div className="min-w-0">
        <p className="text-[22px] font-extrabold leading-none tabular-nums" style={{ color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
          {value}
        </p>
        <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 truncate">{label}</p>
      </div>
    </div>
  );
}

// ─── Split Add Button ─────────────────────────────────────────────────────────
function AddButton({
  onNewCategory,
  onNewService,
  accent,
}: {
  onNewCategory: () => void;
  onNewService: () => void;
  accent: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div className="flex rounded-xl overflow-hidden" style={{ boxShadow: `0 1px 6px ${accent}28` }}>
        {/* Primary action */}
        <button
          onClick={() => { setOpen(false); onNewCategory(); }}
          className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-white transition-all duration-150"
          style={{ background: accent }}
          onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.08)')}
          onMouseLeave={e => (e.currentTarget.style.filter = '')}
        >
          <Plus size={14} />
          Add
        </button>
        {/* Chevron dropdown trigger */}
        <button
          onClick={() => setOpen(v => !v)}
          className="px-2 border-l text-white transition-all duration-150 flex items-center"
          style={{ background: accent, borderColor: `${accent}60` }}
          onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.08)')}
          onMouseLeave={e => (e.currentTarget.style.filter = '')}
        >
          <ChevronDown size={13} className={cn('transition-transform duration-200', open && 'rotate-180')} />
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-1.5 z-50 w-44 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg overflow-hidden"
          style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
        >
          <button
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] transition-colors text-left"
            onClick={() => { setOpen(false); onNewCategory(); }}
          >
            <LayoutGrid size={13} className="text-[var(--color-text-muted)]" />
            New Category
          </button>
          <div className="h-px bg-[var(--color-border)]" />
          <button
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] transition-colors text-left"
            onClick={() => { setOpen(false); onNewService(); }}
          >
            <Tag size={13} className="text-[var(--color-text-muted)]" />
            New Service
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Service Row ─────────────────────────────────────────────────────────────
function ServiceRow({
  sub,
  onEdit,
  onCharges,
  onSkills,
  onDelete,
  searchQ,
}: {
  sub: ServiceSubCategory;
  onEdit: () => void;
  onCharges: () => void;
  onSkills: () => void;
  onDelete: () => void;
  searchQ: string;
}) {
  const price = sub.serviceCharges?.serviceCharge;
  const highlight = (text: string) => {
    if (!searchQ) return <>{text}</>;
    const idx = text.toLowerCase().indexOf(searchQ.toLowerCase());
    if (idx === -1) return <>{text}</>;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-yellow-200 dark:bg-yellow-500/30 rounded px-0.5">{text.slice(idx, idx + searchQ.length)}</mark>
        {text.slice(idx + searchQ.length)}
      </>
    );
  };

  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--color-surface-elevated)] transition-colors duration-150 cursor-default">
      {/* Color dot */}
      <div
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ background: sub.isActive ? '#10b981' : '#94a3b8' }}
      />

      {/* Name */}
      <span className="flex-1 min-w-0 text-[13px] font-medium text-[var(--color-text-primary)] truncate">
        {highlight(sub.name)}
      </span>

      {/* Price */}
      <span className="text-[13px] font-semibold tabular-nums w-20 text-right shrink-0"
        style={{ color: price ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
        {price ? `₹${price}` : '—'}
      </span>

      {/* Status */}
      <div className="w-20 shrink-0">
        <Badge variant={sub.isActive ? 'success' : 'default'}>
          {sub.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
        <button
          title="Edit service"
          onClick={onEdit}
          className="h-7 w-7 flex items-center justify-center rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors"
        >
          <Pencil size={12} />
        </button>
        <button
          title="Set charges"
          onClick={onCharges}
          className="h-7 w-7 flex items-center justify-center rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface)] transition-colors"
        >
          <DollarSign size={12} />
        </button>
        <button
          title="Manage skills"
          onClick={onSkills}
          className="h-7 w-7 flex items-center justify-center rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface)] transition-colors"
        >
          <Tag size={12} />
        </button>
        <button
          title="Delete service"
          onClick={onDelete}
          className="h-7 w-7 flex items-center justify-center rounded-md text-[var(--color-text-muted)] hover:text-red-500 hover:bg-[var(--color-surface)] transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── Category Accordion Row ───────────────────────────────────────────────────
function CategoryAccordion({
  category,
  services,
  isExpanded,
  onToggle,
  onEditCat,
  onDeleteCat,
  onEditSub,
  onChargesSub,
  onSkillsSub,
  onDeleteSub,
  onAddService,
  accent,
  searchQ,
}: {
  category: ServiceCategory;
  services: ServiceSubCategory[];
  isExpanded: boolean;
  onToggle: () => void;
  onEditCat: () => void;
  onDeleteCat: () => void;
  onEditSub: (s: ServiceSubCategory) => void;
  onChargesSub: (s: ServiceSubCategory) => void;
  onSkillsSub: (s: ServiceSubCategory) => void;
  onDeleteSub: (id: string) => void;
  onAddService: () => void;
  accent: string;
  searchQ: string;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  const updatedLabel = new Date(category.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden transition-shadow duration-200"
      style={{ boxShadow: isExpanded ? `0 4px 20px rgba(0,0,0,0.06), 0 0 0 1px ${accent}18` : '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      {/* Gradient top accent line */}
      <div
        className="h-[2px] w-full"
        style={{ background: `linear-gradient(90deg, ${accent}00 0%, ${accent}CC 40%, ${accent}FF 60%, ${accent}44 85%, ${accent}00 100%)` }}
      />

      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-[var(--color-surface-elevated)] transition-colors duration-150 group cursor-pointer"
        onClick={onToggle}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
      >
        {/* Category Icon */}
        <div
          className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${accent}CC 0%, ${accent}88 100%)`, boxShadow: `0 2px 8px ${accent}28` }}
        >
          <LayoutGrid size={15} color="#ffffff" strokeWidth={2} />
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-[var(--color-text-primary)] leading-tight truncate">
            {category.name}
          </p>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
            {services.length} {services.length === 1 ? 'service' : 'services'} · Updated {updatedLabel}
          </p>
        </div>

        {/* Status chip */}
        <Badge variant={category.isActive ? 'success' : 'default'}>
          {category.isActive ? 'Active' : 'Inactive'}
        </Badge>

        {/* Category actions — stop propagation so they don't toggle accordion */}
        <div
          className="flex items-center gap-1 shrink-0 ml-1"
          onClick={e => e.stopPropagation()}
        >
          <button
            title="Edit category"
            onClick={onEditCat}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors"
          >
            <Pencil size={13} />
          </button>
          <button
            title="Delete category"
            onClick={onDeleteCat}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-red-500 hover:bg-[var(--color-surface)] transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* Chevron */}
        <ChevronDown
          size={16}
          className={cn('shrink-0 text-[var(--color-text-muted)] transition-transform duration-250 ease-out ml-1', isExpanded && 'rotate-180')}
        />
      </div>

      {/* Accordion body */}
      <div
        className="overflow-hidden transition-all duration-250 ease-out"
        style={{ maxHeight: isExpanded ? '2000px' : '0px', opacity: isExpanded ? 1 : 0 }}
      >
        <div ref={contentRef} className="px-5 pb-4">
          {/* Services list header */}
          {services.length > 0 && (
            <div className="flex items-center gap-3 px-3 mb-1">
              <div className="w-1.5 shrink-0" />
              <span className="flex-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Service</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)] w-20 text-right shrink-0">Price</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)] w-20 shrink-0">Status</span>
              <div className="w-[84px] shrink-0" />
            </div>
          )}

          {/* Service rows */}
          {services.length > 0 ? (
            <div className="space-y-0.5">
              {services.map(sub => (
                <ServiceRow
                  key={sub.id}
                  sub={sub}
                  searchQ={searchQ}
                  onEdit={() => onEditSub(sub)}
                  onCharges={() => onChargesSub(sub)}
                  onSkills={() => onSkillsSub(sub)}
                  onDelete={() => onDeleteSub(sub.id)}
                />
              ))}
            </div>
          ) : (
            <div className="py-6 flex flex-col items-center gap-2 text-center">
              <div className="h-10 w-10 rounded-xl bg-[var(--color-surface-elevated)] flex items-center justify-center">
                <Tag size={16} className="text-[var(--color-text-muted)]" />
              </div>
              <p className="text-[13px] text-[var(--color-text-secondary)] font-medium">No services yet</p>
              <p className="text-[11px] text-[var(--color-text-muted)]">Add the first service to this category</p>
            </div>
          )}

          {/* Add service footer */}
          <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
            <button
              onClick={onAddService}
              className="flex items-center gap-1.5 text-[12px] font-semibold transition-colors duration-150 hover:underline"
              style={{ color: accent }}
            >
              <Plus size={13} />
              Add Service
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ServiceCatalogPage() {
  const qc = useQueryClient();
  const accent = useRoleAccent();

  // ── Search & filter state
  const [searchQ, setSearchQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // ── Accordion state
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const firstExpanded = useRef(false);

  // ── Category modal state (identical to existing page)
  const [editingCat, setEditingCat] = useState<ServiceCategory | null>(null);
  const [showCreateCat, setShowCreateCat] = useState(false);
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null);

  // ── Sub-category modal state (identical to existing page)
  const [editingSub, setEditingSub] = useState<ServiceSubCategory | null>(null);
  const [showCreateSub, setShowCreateSub] = useState(false);
  const [deleteSubId, setDeleteSubId] = useState<string | null>(null);
  const [chargingId, setChargingId] = useState<string | null>(null);
  const [defaultCatId, setDefaultCatId] = useState<string>('');

  // ── Skill mapping modal state — services select from the Master Skills list only
  const [skillsFor, setSkillsFor] = useState<ServiceSubCategory | null>(null);
  const [addSkillId, setAddSkillId] = useState('');

  // ── Forms (identical to existing pages)
  const catForm = useForm<CatForm>();
  const subForm = useForm<SubForm>();
  const chargesForm = useForm<ChargesForm>();

  // ── Queries (same query keys — no extra API calls)
  const { data: categories = [], isLoading: catsLoading } = useQuery<ServiceCategory[]>({
    queryKey: ['service-categories'],
    queryFn: async () => (await api.get('/web/manager/service-categories')).data.data,
  });

  const { data: allSubs = [], isLoading: subsLoading } = useQuery<ServiceSubCategory[]>({
    queryKey: ['sub-categories', ''],
    queryFn: async () => (await api.get('/web/manager/service-sub-categories')).data.data,
  });

  const isLoading = catsLoading || subsLoading;

  const { data: mappedSkills = [] } = useQuery<SubCategorySkill[]>({
    queryKey: ['sub-category-skills', skillsFor?.id],
    queryFn: async () => (await api.get(`/web/manager/service-sub-categories/${skillsFor!.id}/skills`)).data.data.skills ?? [],
    enabled: !!skillsFor,
  });
  const { data: activeSkills = [] } = useQuery<Skill[]>({
    queryKey: ['skills', 'active'],
    queryFn: async () => (await api.get('/web/manager/skills', { params: { isActive: true } })).data.data,
    enabled: !!skillsFor,
  });

  // Auto-expand first category on load
  useEffect(() => {
    if (!firstExpanded.current && categories.length > 0) {
      setExpanded(new Set([categories[0].id]));
      firstExpanded.current = true;
    }
  }, [categories]);

  // ── Mutations — identical to existing pages ───────────────────────────────

  const saveCatMutation = useMutation({
    mutationFn: (d: CatForm) =>
      editingCat
        ? api.patch(`/web/manager/service-categories/${editingCat.id}`, d)
        : api.post('/web/manager/service-categories', { name: d.name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-categories'] });
      toast.success(editingCat ? 'Category updated' : 'Category created');
      setEditingCat(null); setShowCreateCat(false); catForm.reset();
    },
    onError: () => toast.error('Failed'),
  });

  const deleteCatMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/web/manager/service-categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-categories'] });
      toast.success('Category deleted'); setDeleteCatId(null);
    },
    onError: () => toast.error('Failed'),
  });

  const saveSubMutation = useMutation({
    mutationFn: (d: SubForm) =>
      editingSub
        ? api.patch(`/web/manager/service-sub-categories/${editingSub.id}`, d)
        : api.post('/web/manager/service-sub-categories', { categoryId: d.categoryId, name: d.name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sub-categories'] });
      toast.success(editingSub ? 'Service updated' : 'Service created');
      setEditingSub(null); setShowCreateSub(false); subForm.reset();
    },
    onError: () => toast.error('Failed'),
  });

  const deleteSubMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/web/manager/service-sub-categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sub-categories'] });
      toast.success('Service deleted'); setDeleteSubId(null);
    },
    onError: () => toast.error('Failed'),
  });

  const mapSkillMutation = useMutation({
    mutationFn: (skillId: string) => api.post(`/web/manager/service-sub-categories/${skillsFor!.id}/skills`, { skillId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sub-category-skills', skillsFor?.id] });
      toast.success('Skill mapped'); setAddSkillId('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to map skill'),
  });
  const unmapSkillMutation = useMutation({
    mutationFn: (skillId: string) => api.delete(`/web/manager/service-sub-categories/${skillsFor!.id}/skills/${skillId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sub-category-skills', skillsFor?.id] });
      toast.success('Skill removed');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to remove skill'),
  });

  const chargesMutation = useMutation({
    mutationFn: (d: ChargesForm) => api.post(`/web/manager/service-charges/${chargingId}`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sub-categories'] });
      toast.success('Charges saved'); setChargingId(null); chargesForm.reset();
    },
    onError: () => toast.error('Failed'),
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  const openEditCat = (c: ServiceCategory) => {
    setEditingCat(c);
    catForm.reset({ name: c.name, isActive: c.isActive });
  };

  const openEditSub = (s: ServiceSubCategory) => {
    setEditingSub(s);
    subForm.reset({ categoryId: s.categoryId, name: s.name, isActive: s.isActive });
  };

  const openChargeSub = (s: ServiceSubCategory) => {
    const c = s.serviceCharges;
    setChargingId(s.id);
    chargesForm.reset({
      serviceCharge: c?.serviceCharge ?? 0,
      inspectionCharge: c?.inspectionCharge ?? 0,
      emergencyCharge: c?.emergencyCharge ?? 0,
    });
  };

  const openNewService = (categoryId = '') => {
    setDefaultCatId(categoryId);
    subForm.reset({ categoryId, name: '', isActive: true });
    setShowCreateSub(true);
  };

  const toggleAccordion = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Filtered data ─────────────────────────────────────────────────────────

  const catOptions = categories.map(c => ({ value: c.id, label: c.name }));

  // Only active, not-already-mapped skills are offered — services select from the
  // Master Skills list, they never define their own.
  const unmappedActiveSkillOptions = activeSkills
    .filter(s => !mappedSkills.some(ms => ms.skillId === s.id))
    .map(s => ({ value: s.id, label: s.name }));

  const filteredData = useMemo(() => {
    const q = searchQ.toLowerCase().trim();
    const statusOk = (isActive: boolean) =>
      statusFilter === '' || (statusFilter === 'active' ? isActive : !isActive);

    return categories
      .filter(cat => {
        if (!statusOk(cat.isActive)) return false;
        if (!q) return true;
        const catMatch = cat.name.toLowerCase().includes(q);
        const subsForCat = allSubs.filter(s => s.categoryId === cat.id);
        return catMatch || subsForCat.some(s => s.name.toLowerCase().includes(q));
      })
      .map(cat => ({
        cat,
        services: allSubs.filter(s => {
          if (s.categoryId !== cat.id) return false;
          if (!statusOk(s.isActive)) return false;
          if (!q) return true;
          return s.name.toLowerCase().includes(q) || cat.name.toLowerCase().includes(q);
        }),
      }));
  }, [categories, allSubs, searchQ, statusFilter]);

  // Auto-expand categories that have matching services on search
  useEffect(() => {
    if (searchQ) {
      const matchedCatIds = filteredData
        .filter(({ cat, services }) =>
          cat.name.toLowerCase().includes(searchQ.toLowerCase()) || services.length > 0
        )
        .map(({ cat }) => cat.id);
      setExpanded(new Set(matchedCatIds));
    }
  }, [searchQ, filteredData]);

  // ── KPI numbers ──────────────────────────────────────────────────────────
  const kpi = useMemo(() => ({
    cats: categories.length,
    subs: allSubs.length,
    active: allSubs.filter(s => s.isActive).length,
    inactive: allSubs.filter(s => !s.isActive).length,
  }), [categories, allSubs]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Categories and Sub-Categories</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
            Manage all service categories and services from a single page.
          </p>
        </div>
        <AddButton
          accent={accent}
          onNewCategory={() => {
            catForm.reset({ name: '', isActive: true });
            setShowCreateCat(true);
          }}
          onNewService={() => openNewService('')}
        />
      </div>

      {/* ── KPI row */}
      {!isLoading && (
        <div className="flex gap-3 flex-wrap">
          <KpiCard label="Categories" value={kpi.cats} accent={accent} />
          <KpiCard label="Total Services" value={kpi.subs} accent={accent} />
          <KpiCard label="Active Services" value={kpi.active} accent="#10b981" />
          <KpiCard label="Inactive Services" value={kpi.inactive} accent="#94a3b8" />
        </div>
      )}

      {/* ── Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search categories or services…"
            className="w-full h-9 pl-9 pr-8 text-[13px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none transition-all"
            onFocus={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${accent}18`; }}
            onBlur={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = ''; }}
          />
          {searchQ && (
            <button
              onClick={() => setSearchQ('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-9 px-3 text-[13px] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] outline-none cursor-pointer appearance-none min-w-[130px] transition-all"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' fill=\'%2394a3b8\' viewBox=\'0 0 16 16\'%3E%3Cpath d=\'M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
          onFocus={e => { e.currentTarget.style.borderColor = accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${accent}18`; }}
          onBlur={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.boxShadow = ''; }}
        >
          <option value="">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* ── Accordion list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[var(--color-surface-elevated)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-36 rounded bg-[var(--color-surface-elevated)]" />
                  <div className="h-2.5 w-24 rounded bg-[var(--color-surface-elevated)]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredData.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-3 text-center">
          <div className="h-14 w-14 rounded-2xl bg-[var(--color-surface-elevated)] flex items-center justify-center">
            <LayoutGrid size={22} className="text-[var(--color-text-muted)]" />
          </div>
          <p className="text-sm font-semibold text-[var(--color-text-secondary)]">
            {searchQ ? 'No results found' : 'No categories yet'}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {searchQ ? `Try a different search term.` : 'Click "+ Add → New Category" to get started.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredData.map(({ cat, services }) => (
            <CategoryAccordion
              key={cat.id}
              category={cat}
              services={services}
              isExpanded={expanded.has(cat.id)}
              onToggle={() => toggleAccordion(cat.id)}
              onEditCat={() => openEditCat(cat)}
              onDeleteCat={() => setDeleteCatId(cat.id)}
              onEditSub={openEditSub}
              onChargesSub={openChargeSub}
              onSkillsSub={s => { setSkillsFor(s); setAddSkillId(''); }}
              onDeleteSub={id => setDeleteSubId(id)}
              onAddService={() => {
                setExpanded(prev => new Set(prev).add(cat.id));
                openNewService(cat.id);
              }}
              accent={accent}
              searchQ={searchQ}
            />
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODALS — 100% identical to existing service-categories &
          service-sub-categories pages. Zero logic changed.
         ══════════════════════════════════════════════════════════════════════ */}

      {/* Category create / edit modal */}
      <Modal
        open={showCreateCat || !!editingCat}
        onClose={() => { setShowCreateCat(false); setEditingCat(null); catForm.reset(); }}
        title={editingCat ? 'Edit Category' : 'New Category'}
        size="sm"
      >
        <form onSubmit={catForm.handleSubmit(d => saveCatMutation.mutate(d))} className="space-y-4">
          <Input label="Name" {...catForm.register('name', { required: true })} />
          {editingCat && (
            <div className="flex items-center gap-2">
              <input type="checkbox" id="catIsActive" {...catForm.register('isActive')} className="h-4 w-4" />
              <label htmlFor="catIsActive" className="text-sm text-[var(--color-text-secondary)]">Active</label>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => { setShowCreateCat(false); setEditingCat(null); catForm.reset(); }}>
              Cancel
            </Button>
            <Button type="submit" loading={catForm.formState.isSubmitting}>
              {editingCat ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Sub-category create / edit modal */}
      <Modal
        open={showCreateSub || !!editingSub}
        onClose={() => { setShowCreateSub(false); setEditingSub(null); subForm.reset(); }}
        title={editingSub ? 'Edit Service' : 'New Service'}
        size="sm"
      >
        <form onSubmit={subForm.handleSubmit(d => saveSubMutation.mutate(d))} className="space-y-4">
          <Select
            label="Category"
            options={catOptions}
            placeholder="Select category"
            {...subForm.register('categoryId', { required: true })}
          />
          <Input label="Name" {...subForm.register('name', { required: true })} />
          {editingSub && (
            <div className="flex items-center gap-2">
              <input type="checkbox" id="subIsActive" {...subForm.register('isActive')} className="h-4 w-4" />
              <label htmlFor="subIsActive" className="text-sm text-[var(--color-text-secondary)]">Active</label>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => { setShowCreateSub(false); setEditingSub(null); subForm.reset(); }}>
              Cancel
            </Button>
            <Button type="submit" loading={subForm.formState.isSubmitting}>
              {editingSub ? 'Save' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Charges modal */}
      <Modal
        open={!!chargingId}
        onClose={() => { setChargingId(null); chargesForm.reset(); }}
        title="Set Service Charges"
        size="sm"
      >
        <form onSubmit={chargesForm.handleSubmit(d => chargesMutation.mutate(d))} className="space-y-4">
          <Input label="Service Charge (₹)" type="number" step="0.01" {...chargesForm.register('serviceCharge', { valueAsNumber: true })} />
          <Input label="Inspection Charge (₹)" type="number" step="0.01" {...chargesForm.register('inspectionCharge', { valueAsNumber: true })} />
          <Input label="Emergency Charge (₹)" type="number" step="0.01" {...chargesForm.register('emergencyCharge', { valueAsNumber: true })} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => { setChargingId(null); chargesForm.reset(); }}>
              Cancel
            </Button>
            <Button type="submit" loading={chargesForm.formState.isSubmitting}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      {/* Skill mapping modal — select from the Master Skills list only */}
      <Modal
        open={!!skillsFor}
        onClose={() => { setSkillsFor(null); setAddSkillId(''); }}
        title={`Skills — ${skillsFor?.name ?? ''}`}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-[var(--color-text-muted)]">
            Select which skills a technician needs for this service. Skills come from the Master Skills list — add new ones there first.
          </p>

          {mappedSkills.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] py-2">No skills required yet.</p>
          ) : (
            <div className="space-y-2">
              {mappedSkills.map(ms => (
                <div key={ms.skillId} className="flex items-center justify-between rounded-lg bg-[var(--color-surface-elevated)] px-3 py-2 text-sm">
                  <span className="font-medium">{ms.skill.name}</span>
                  <button
                    type="button"
                    onClick={() => unmapSkillMutation.mutate(ms.skillId)}
                    disabled={unmapSkillMutation.isPending}
                    className="text-[var(--color-text-muted)] hover:text-red-500 transition-colors disabled:opacity-40"
                    title="Remove"
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 items-end pt-2 border-t border-[var(--color-border)]">
            <Select
              label="Add a skill"
              options={[{ value: '', label: unmappedActiveSkillOptions.length ? 'Select skill...' : 'No more active skills to add' }, ...unmappedActiveSkillOptions]}
              value={addSkillId}
              onChange={e => setAddSkillId(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={() => addSkillId && mapSkillMutation.mutate(addSkillId)}
              disabled={!addSkillId || mapSkillMutation.isPending}
              loading={mapSkillMutation.isPending}
            >
              Add
            </Button>
          </div>
        </div>
      </Modal>

      {/* Category delete confirm */}
      <ConfirmDialog
        open={!!deleteCatId}
        onClose={() => setDeleteCatId(null)}
        onConfirm={() => deleteCatId && deleteCatMutation.mutate(deleteCatId)}
        message="Delete this category? All associated services will also be removed."
        loading={deleteCatMutation.isPending}
      />

      {/* Sub-category delete confirm */}
      <ConfirmDialog
        open={!!deleteSubId}
        onClose={() => setDeleteSubId(null)}
        onConfirm={() => deleteSubId && deleteSubMutation.mutate(deleteSubId)}
        message="Delete this service?"
        loading={deleteSubMutation.isPending}
      />
    </div>
  );
}
