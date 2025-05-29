<script lang="ts">
	import Favicon from '$lib/components/Favicon.svelte';
</script>

<header
	class="header sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6"
>
	<nav
		class="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6"
	>
		<a href="/home" class="flex items-center gap-2 text-lg font-semibold md:text-base">
			<Favicon />
			<span class="sr-only">Spectre VRC</span>
		</a>
	</nav>
</header>

<!--Forces header to be above everything-->
<style>
	.header {
		z-index: 1;
	}
</style>
