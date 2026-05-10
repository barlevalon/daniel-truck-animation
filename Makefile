publish:
	rsync --delete -az public/ ansible@personal:/srv/homelab/runtime/truck/site/
