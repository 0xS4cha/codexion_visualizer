export type DashboardUser = {
  image?: string | null;
  login: string;
  displayName: string;
  email: string;
  level?: number | null;
  wallet?: number | null;
  correctionPoints?: number | null;
};

export type StatCardProps = {
  label: string;
  value: string | number;
};

export type ActionChipProps = {
  label: string;
};
export type UserReadme = {
  avatar_url: string;
  username: string;
  url: string;
}