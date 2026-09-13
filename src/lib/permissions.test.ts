import { describe, it, expect } from 'vitest';
import {
  canViewTasks, canManageTasks, isTaskStatus, isTaskPriority,
  canViewRequests, canManageRequests,
  canManageFees, canViewEvents, canManageEvents,
  isRequestStatus, isRequestType,
  canViewEducation, canManageEducation, canViewFinance, canManageUsers,
  canViewDonations, canViewBeneficiaries, canUseAssistant, ASSIGNABLE_ROLES,
} from './permissions';

describe('task permissions', () => {
  it('members can view, staff/admin can manage', () => {
    expect(canViewTasks('MEMBER')).toBe(true);
    expect(canManageTasks('MEMBER')).toBe(false);
    expect(canManageTasks('STAFF')).toBe(true);
    expect(canManageTasks('ORG_ADMIN')).toBe(true);
  });
  it('rejects unknown roles', () => {
    expect(canViewTasks('HACKER')).toBe(false);
    expect(canManageTasks('')).toBe(false);
  });
  it('validates task status/priority enums', () => {
    expect(isTaskStatus('TODO')).toBe(true);
    expect(isTaskStatus('DONE')).toBe(true);
    expect(isTaskStatus('DROP TABLE')).toBe(false);
    expect(isTaskPriority('URGENT')).toBe(true);
    expect(isTaskPriority('nope')).toBe(false);
  });
});

describe('request permissions', () => {
  it('only org admins approve/reject; all members submit', () => {
    expect(canViewRequests('MEMBER')).toBe(true);
    expect(canManageRequests('STAFF')).toBe(false);
    expect(canManageRequests('ORG_ADMIN')).toBe(true);
  });
  it('validates request enums', () => {
    expect(isRequestStatus('APPROVED')).toBe(true);
    expect(isRequestStatus('MAYBE')).toBe(false);
    expect(isRequestType('EXAM')).toBe(true);
    expect(isRequestType('xxx')).toBe(false);
  });
});

describe('events & fees permissions', () => {
  it('staff/admin manage, members view events', () => {
    expect(canViewEvents('MEMBER')).toBe(true);
    expect(canManageEvents('MEMBER')).toBe(false);
    expect(canManageEvents('STAFF')).toBe(true);
    expect(canManageFees('ORG_ADMIN')).toBe(true);
    expect(canManageFees('MEMBER')).toBe(false);
  });
});

describe('new roles: supervisor / teacher / student boundaries', () => {
  it('supervisor oversees education & programs but not finance/donations/users management', () => {
    expect(canViewEducation('SUPERVISOR')).toBe(true);
    expect(canManageEducation('SUPERVISOR')).toBe(true);
    expect(canManageUsers('SUPERVISOR')).toBe(false);
    expect(canViewFinance('SUPERVISOR')).toBe(false);
    expect(canViewDonations('SUPERVISOR')).toBe(false);
  });
  it('teacher sees education but cannot manage it org-wide or view finance', () => {
    expect(canViewEducation('TEACHER')).toBe(true);
    expect(canManageEducation('TEACHER')).toBe(false);
    expect(canManageUsers('TEACHER')).toBe(false);
    expect(canViewFinance('TEACHER')).toBe(false);
  });
  it('student is tightly scoped: no education roster, finance, donations or beneficiaries', () => {
    expect(canViewEducation('STUDENT')).toBe(false);
    expect(canViewFinance('STUDENT')).toBe(false);
    expect(canViewDonations('STUDENT')).toBe(false);
    expect(canViewBeneficiaries('STUDENT')).toBe(false);
    expect(canManageUsers('STUDENT')).toBe(false);
    expect(canUseAssistant('STUDENT')).toBe(false);
  });
  it('the three new roles are assignable within an org', () => {
    for (const r of ['SUPERVISOR', 'TEACHER', 'STUDENT']) {
      expect(ASSIGNABLE_ROLES).toContain(r);
    }
  });
});
