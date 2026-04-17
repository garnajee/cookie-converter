export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // divide accent from letter
    .replace(/[\u0300-\u036f]/g, '') // remove accent
    .replace(/\s+/g, '-') // replace spaces with -
    .replace(/[^\w-]+/g, '') // remove all non-word chars
    .replace(/--+/g, '-') // replace multiple - with single -
    .replace(/^-+/, '') // trim - from start of text
    .replace(/-+$/, ''); // trim - from end of text
};

export const getBaseDomain = (domain: string): string => {
  const parts = domain.replace(/^\./, '').split('.');
  if (parts.length >= 2) {
    // Basic logic for common TLDs, but slugifying the whole domain (excluding TLD if possible) is better
    // Or just slugify the whole thing. The user gave examples: "primevide" (likely from primevideo.com)
    return parts[parts.length - 2];
  }
  return parts[0] || '';
};
