/**
 * Checks if two arrays have same values
 * 
 * Inorder Flow:
 * - Check if length of both arrays are same else return false
 * - Create a set of b array and check if each item of a array is present in set then return true
 * 
 * @remarks
 * This was made for checking the scopes array
 */

export const arraysEqual = (a: string[], b:string[]) => {
	if (a.length !== b.length) return false;

	const setB = new Set(b);
	return a.every(item => setB.has(item));
};
