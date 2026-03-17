SELECT 'User' AS tbl, count(*) FROM public."User"
UNION ALL SELECT 'Profile', count(*) FROM public."Profile"
UNION ALL SELECT 'Post', count(*) FROM public."Post"
UNION ALL SELECT 'Follow', count(*) FROM public."Follow";
