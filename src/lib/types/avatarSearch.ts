export interface UnityPackage {
	assetUrl: string;
	assetUrlObject: object;
	assetVersion: number;
	created_at: string;
	id: string;
	platform: string;
	pluginUrl: string;
	pluginUrlObject: object;
	unitySortNumber: number;
	unityVersion: string;
}

export interface AvatarData {
	assetUrl: string;
	assetUrlObject: object;
	authorId: string;
	authorName: string;
	created_at: string;
	description: string;
	featured: boolean;
	id: string;
	imageUrl: string;
	name: string;
	releaseStatus: string;
	tags: string[];
	thumbnailImageUrl: string;
	unityPackageUrl: string;
	unityPackages: UnityPackage[];
	updated_at: string;
	version: number;
}