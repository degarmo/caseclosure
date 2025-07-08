import axios from "axios";

// Check if a subdomain is available
export const checkSubdomain = async (subdomain) => {
  const res = await axios.get(`/api/sites/sites/check_subdomain/`, {
    params: { subdomain },
    withCredentials: true,
  });
  return res.data.available;
};

// Publish a site by PATCHing its subdomain and is_public
export const publishMemorialSite = async (siteId, { subdomain, is_public = true }) => {
  const res = await axios.patch(
    `/api/sites/sites/${siteId}/`,
    { subdomain, is_public },
    { withCredentials: true }
  );
  return res.data;
};
