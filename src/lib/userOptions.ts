export const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export const MEMBERSHIP_OPTIONS = [
  { value: "member", label: "Member" },
  { value: "visitor", label: "Visitor" },
  { value: "invitee", label: "Invitee" },
  { value: "convert", label: "New Convert" },
];

export const LEVEL_OPTIONS = [
  { value: "year_1", label: "Year 1" },
  { value: "year_2", label: "Year 2" },
  { value: "year_3", label: "Year 3" },
  { value: "year_4", label: "Year 4" },
];

export const DEPARTMENT_OPTIONS = [
  { value: "choir", label: "Choir" },
  { value: "media", label: "Media" },
  { value: "evangelism", label: "Evangelism" },
  { value: "ushering", label: "Ushering" },
  { value: "prayer", label: "Prayer" },
  { value: "hospitality", label: "Hospitality" },
  { value: "protocol", label: "Protocol" },
  { value: "other", label: "Other" },
];

export const RELATIONSHIP_OPTIONS = [
  { value: "mother", label: "Mother" },
  { value: "father", label: "Father" },
  { value: "sister", label: "Sister" },
  { value: "brother", label: "Brother" },
  { value: "guardian", label: "Guardian" },
  { value: "friend", label: "Friend" },
  { value: "other", label: "Other" },
];

function values(options: { value: string }[]): [string, ...string[]] {
  return options.map((o) => o.value) as [string, ...string[]];
}

export const GENDER_VALUES = values(GENDER_OPTIONS);
export const MEMBERSHIP_VALUES = values(MEMBERSHIP_OPTIONS);
export const LEVEL_VALUES = values(LEVEL_OPTIONS);
export const DEPARTMENT_VALUES = values(DEPARTMENT_OPTIONS);
export const RELATIONSHIP_VALUES = values(RELATIONSHIP_OPTIONS);
