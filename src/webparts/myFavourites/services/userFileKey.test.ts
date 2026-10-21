import {
  toLegacyUserFileKeyFromLoginName,
  toLegacyUserFavouritesFileName,
  toUserFileKey,
  toUserFavouritesFileName
} from './userFileKey';

describe('userFileKey', () => {
  it('normalizes Entra object id to lowercase guid file key', () => {
    expect(toUserFileKey('{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}')).toBe(
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    );
  });

  it('builds json file name from Entra object id', () => {
    expect(toUserFavouritesFileName('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890.json'
    );
  });

  it('rejects invalid Entra user id', () => {
    expect(() => toUserFileKey('jane.doe@fraserhealth.ca')).toThrow(/valid GUID/i);
  });

  it('uses membership identifier from legacy claims login', () => {
    expect(toLegacyUserFileKeyFromLoginName('i:0#.f|membership|jane.doe@fraserhealth.ca')).toBe(
      'jane.doe@fraserhealth.ca'
    );
  });

  it('strips domain prefix from legacy login', () => {
    expect(toLegacyUserFileKeyFromLoginName('FRASER\\jdoe')).toBe('jdoe');
  });

  it('builds legacy json file name from login name', () => {
    expect(toLegacyUserFavouritesFileName('i:0#.f|membership|jane.doe@fraserhealth.ca')).toBe(
      'jane.doe@fraserhealth.ca.json'
    );
  });
});
