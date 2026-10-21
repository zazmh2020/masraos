import { describe, expect, it } from 'vitest';
import { DONOR_MASK, withBeneficiaryId, withDonor, withStudentContacts } from './sensitive-fields';
import {
  ALL_CAPS, CAP_GROUPS, canSeeBeneficiaryId, canSeeDonors, canSeeStudentContacts,
} from './permissions';

describe('sensitive field masking (NP1)', () => {
  const student = { id: 's', name: 'طالب', phone: '0500', guardianName: 'ولي', guardianPhone: '0511', guardianEmail: 'g@x.test' };

  it('removes student/guardian contact values (not partial masks) and keeps the rest', () => {
    const m = withStudentContacts(student, false);
    expect(m).toEqual({ id: 's', name: 'طالب', phone: null, guardianName: 'ولي', guardianPhone: null, guardianEmail: null });
    expect(JSON.stringify(m)).not.toMatch(/0500|0511|g@x/);
    expect(withStudentContacts(student, true)).toBe(student);
  });

  it('works on objects that only select some of the contact fields', () => {
    expect(withStudentContacts({ id: 's', phone: '0500' }, false)).toEqual({ id: 's', phone: null });
    expect(withStudentContacts({ id: 's', guardianPhone: '1' }, false)).toEqual({ id: 's', guardianPhone: null });
  });

  it('hides the national id and the donor identity unless allowed; the amount is untouched', () => {
    expect(withBeneficiaryId({ id: 'b', nationalId: '123456' }, false)).toEqual({ id: 'b', nationalId: null });
    expect(withBeneficiaryId({ id: 'b', nationalId: '123456' }, true).nationalId).toBe('123456');
    expect(withDonor({ donorName: 'فلان', amount: 50 }, false)).toEqual({ donorName: DONOR_MASK, amount: 50 });
    expect(withDonor({ donorName: 'فلان', amount: 50 }, true).donorName).toBe('فلان');
  });
});

describe('sensitive capabilities by default role', () => {
  it('are known capabilities shown in the role editor under the sensitive kind', () => {
    for (const cap of ['students.contact', 'beneficiaries.sensitive', 'donations.donors']) {
      expect(ALL_CAPS).toContain(cap);
      const found = CAP_GROUPS.flatMap((g) => g.caps).find((c) => c.key === cap);
      expect(found?.kind).toBe('sensitive');
    }
  });

  it('keep today’s visibility for built-in roles and nothing more', () => {
    expect([canSeeStudentContacts('ORG_ADMIN'), canSeeBeneficiaryId('ORG_ADMIN'), canSeeDonors('ORG_ADMIN')]).toEqual([true, true, true]);
    expect([canSeeStudentContacts('STAFF'), canSeeBeneficiaryId('STAFF'), canSeeDonors('STAFF')]).toEqual([true, true, true]);
    expect([canSeeStudentContacts('SUPERVISOR'), canSeeBeneficiaryId('SUPERVISOR'), canSeeDonors('SUPERVISOR')]).toEqual([true, false, false]);
    expect([canSeeStudentContacts('TEACHER'), canSeeBeneficiaryId('TEACHER'), canSeeDonors('TEACHER')]).toEqual([true, false, false]);
    expect([canSeeStudentContacts('MEMBER'), canSeeBeneficiaryId('MEMBER'), canSeeDonors('MEMBER')]).toEqual([false, false, false]);
    expect([canSeeStudentContacts('STUDENT'), canSeeBeneficiaryId('STUDENT'), canSeeDonors('STUDENT')]).toEqual([false, false, false]);
  });

  it('a custom role sees sensitive data only when it lists the capability', () => {
    const viewer = { role: 'STAFF', permissions: ['education.view', 'donations.view', 'beneficiaries.view'] };
    expect([canSeeStudentContacts(viewer), canSeeBeneficiaryId(viewer), canSeeDonors(viewer)]).toEqual([false, false, false]);
    const full = { role: 'STAFF', permissions: [...viewer.permissions, 'students.contact', 'beneficiaries.sensitive', 'donations.donors'] };
    expect([canSeeStudentContacts(full), canSeeBeneficiaryId(full), canSeeDonors(full)]).toEqual([true, true, true]);
  });
});
