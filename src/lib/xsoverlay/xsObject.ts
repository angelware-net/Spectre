export const defaultXSObject: XSObject = {
	sender: "systemui",
	target: "xsoverlay",
	command: "",
	jsonData: "",
	rawData: "",
}

export interface XSObject {
	sender: string;
	target: string;
	command: string;
	jsonData: string;
	rawData: string;
}