import { describe, it, expect } from 'vitest';
import {
  ORG_MODULES, isOrgModule, moduleEnabled,
  MODULE_REGISTRY, MODULE_DEFS, planMeets, moduleAppliesToType, modulesForType, moduleStatusFor,
} from './modules';
import { SECTORS, sectorForType, creatableSectors, activeSectors } from './org-types';

describe('org modules', () => {
  it('validates module keys', () => {
    expect(isOrgModule('operations')).toBe(true);
    expect(isOrgModule('education')).toBe(true);
    expect(isOrgModule('nonsense')).toBe(false);
  });
  it('treats a module as enabled unless it is in the disabled list', () => {
    expect(moduleEnabled([], 'operations')).toBe(true);
    expect(moduleEnabled(['operations'], 'operations')).toBe(false);
    expect(moduleEnabled(['documents'], 'operations')).toBe(true);
    expect(moduleEnabled(null, 'education')).toBe(true);
    expect(moduleEnabled(undefined, 'education')).toBe(true);
  });
  it('exposes the canonical module list', () => {
    expect(ORG_MODULES).toContain('operations');
    expect(ORG_MODULES.length).toBeGreaterThanOrEqual(8);
  });
});

describe('module registry (metadata)', () => {
  it('has a definition for every module', () => {
    expect(MODULE_DEFS.length).toBe(ORG_MODULES.length);
    for (const m of ORG_MODULES) {
      expect(MODULE_REGISTRY[m].id).toBe(m);
      expect(MODULE_REGISTRY[m].icon).toBeTruthy();
    }
  });

  it('compares plan ranks correctly', () => {
    expect(planMeets('PROFESSIONAL', 'GROWTH')).toBe(true);
    expect(planMeets('STARTER', 'GROWTH')).toBe(false);
    expect(planMeets('ENTERPRISE', 'PROFESSIONAL')).toBe(true);
    expect(planMeets('GROWTH', 'GROWTH')).toBe(true);
  });

  it('treats empty organizationTypes as general (applies to all types)', () => {
    expect(moduleAppliesToType('documents', 'MOSQUE')).toBe(true);
    expect(moduleAppliesToType('documents', 'ASSOCIATION')).toBe(true);
    // education خاص بـ MOSQUE/SCHOOL
    expect(moduleAppliesToType('education', 'MOSQUE')).toBe(true);
    expect(moduleAppliesToType('education', 'ASSOCIATION')).toBe(false);
    // operations خاص بالجمعيات والمشاريع
    expect(moduleAppliesToType('operations', 'MOSQUE')).toBe(false);
    expect(moduleAppliesToType('operations', 'ASSOCIATION')).toBe(true);
  });

  it('modulesForType returns general + type-specific modules', () => {
    const mosque = modulesForType('MOSQUE').map((d) => d.id);
    expect(mosque).toContain('education');
    expect(mosque).toContain('documents');
    expect(mosque).not.toContain('operations');
  });

  it('computes status from type, plan and disabled list', () => {
    // education غير متاح لجمعية
    expect(moduleStatusFor('education', { type: 'ASSOCIATION', plan: 'ENTERPRISE' })).toBe('UNAVAILABLE');
    // education يحتاج PROFESSIONAL
    expect(moduleStatusFor('education', { type: 'MOSQUE', plan: 'GROWTH' })).toBe('PLAN_LOCKED');
    expect(moduleStatusFor('education', { type: 'MOSQUE', plan: 'PROFESSIONAL' })).toBe('ACTIVE');
    // معطّل يدويًا
    expect(moduleStatusFor('documents', { type: 'MOSQUE', plan: 'STARTER', disabledModules: ['documents'] })).toBe('DISABLED');
    expect(moduleStatusFor('documents', { type: 'MOSQUE', plan: 'STARTER' })).toBe('ACTIVE');
  });
});

describe('sectors (metadata)', () => {
  it('defines the seven sectors', () => {
    expect(SECTORS.length).toBe(7);
    expect(SECTORS.map((s) => s.id)).toContain('QURAN_CENTER');
  });
  it('maps the active Quran-center sector to the MOSQUE type', () => {
    const s = sectorForType('MOSQUE');
    expect(s?.id).toBe('QURAN_CENTER');
    expect(s?.status).toBe('ACTIVE');
  });
  it('only surfaces sectors backed by a real OrgType as creatable', () => {
    for (const s of creatableSectors()) expect(s.type).not.toBeNull();
    expect(activeSectors().every((s) => s.status === 'ACTIVE')).toBe(true);
  });
});
