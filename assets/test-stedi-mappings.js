/**
 * Test script for Stedi Error Mappings
 * This can be run in the browser console to verify the error mappings are working correctly
 */

import { getStediErrorMapping, createStediErrorEligibilityData, getErrorTitle, isUserCorrectableError } from "./stedi-error-mappings.js";

/**
 * Test the Stedi error mappings with sample error codes
 */
function testStediErrorMappings() {
	console.log("🧪 Testing Stedi Error Mappings...\n");

	// Test cases for different error types
	const testCases = [
		// Technical Problem Errors
		{ code: "42", description: "Unable to Respond at Current Time" },
		{ code: "43", description: "Invalid / Missing Provider Identification" },
		{ code: "79", description: "Invalid Participant Identification" },
		{ code: "80", description: "No Response received - Transaction Terminated" },

		// Insurance Plans Errors
		{ code: "58", description: "Invalid / Missing Date of Birth" },
		{ code: "72", description: "Invalid/Missing Subscriber/Insured ID" },
		{ code: "73", description: "Invalid/Missing Subscriber/Insured Name" },
		{ code: "75", description: "Subscriber/Insured Not Found" },

		// Unknown error
		{ code: "999", description: "Unknown Error Code" }
	];

	testCases.forEach(testCase => {
		console.log(`\n📋 Testing Error Code: ${testCase.code} (${testCase.description})`);

		// Test mapping retrieval
		const mapping = getStediErrorMapping(testCase.code);
		console.log("✅ Mapping:", {
			screenType: mapping.screenType,
			category: mapping.category,
			userMessage: mapping.userMessage.substring(0, 50) + "...",
			canRetry: mapping.canRetry,
			requiresManualReview: mapping.requiresManualReview
		});

		// Test eligibility data creation
		const eligibilityData = createStediErrorEligibilityData(testCase.code, `Custom message for ${testCase.code}`);
		console.log("✅ Eligibility Data:", {
			eligibilityStatus: eligibilityData.eligibilityStatus,
			errorCode: eligibilityData.stediErrorCode,
			userMessage: eligibilityData.userMessage.substring(0, 50) + "...",
			isStediError: eligibilityData.error.isStediError
		});

		// Test helper functions
		const errorTitle = getErrorTitle(testCase.code);
		const isUserCorrectable = isUserCorrectableError(testCase.code);
		console.log("✅ Helper Functions:", {
			errorTitle,
			isUserCorrectable
		});
	});

	console.log("\n🎉 Stedi Error Mappings Test Complete!");
}

/**
 * Test error mapping categorization
 */
function testErrorCategorization() {
	console.log("\n🔍 Testing Error Categorization...\n");

	const technicalErrors = ["42", "43", "79", "80", "97", "AA"];
	const insuranceErrors = ["58", "72", "73", "75", "76"];

	console.log("Technical Problem Errors:");
	technicalErrors.forEach(code => {
		const mapping = getStediErrorMapping(code);
		console.log(`  ${code}: ${mapping.screenType} (${mapping.category})`);
	});

	console.log("\nInsurance Plans Errors:");
	insuranceErrors.forEach(code => {
		const mapping = getStediErrorMapping(code);
		console.log(`  ${code}: ${mapping.screenType} (${mapping.category})`);
	});
}

/**
 * Test backwards compatibility with existing AAA error codes
 */
function testBackwardsCompatibility() {
	console.log("\n🔄 Testing Backwards Compatibility...\n");

	// These codes should still work with the new system
	const aaaErrorCodes = ["42", "43", "72", "73", "75", "76", "79"];

	aaaErrorCodes.forEach(code => {
		const stediData = createStediErrorEligibilityData(code);
		console.log(`Code ${code}: ${stediData.eligibilityStatus} - ${stediData.error.isStediError ? "Stedi" : "AAA"} error`);
	});
}

// Export test functions for use in browser console
if (typeof window !== "undefined") {
	window.testStediErrorMappings = testStediErrorMappings;
	window.testErrorCategorization = testErrorCategorization;
	window.testBackwardsCompatibility = testBackwardsCompatibility;

	console.log("🧪 Stedi Error Mapping Tests Available:");
	console.log("  - testStediErrorMappings()");
	console.log("  - testErrorCategorization()");
	console.log("  - testBackwardsCompatibility()");
}

export { testStediErrorMappings, testErrorCategorization, testBackwardsCompatibility };
