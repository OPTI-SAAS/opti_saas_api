import {
  PRODUCT_PRICING_MODES,
  ProductPricingMode,
} from '../enums/client/product.client.enum';

type PricingModeParameters = {
  pricingMode?: ProductPricingMode;
  coefficient?: number;
  fixedPrice?: number;
  fixedAddedAmount?: number;
};

type PricingModeValidationOptions = {
  allowMissingPricingMode?: boolean;
};

export const validatePricingModeParameters = (
  params: PricingModeParameters,
  options: PricingModeValidationOptions = {},
): boolean => {
  const hasCoefficient = params.coefficient !== undefined;
  const hasFixedPrice = params.fixedPrice !== undefined;
  const hasFixedAddedAmount = params.fixedAddedAmount !== undefined;
  const hasAnyPricingValue =
    hasCoefficient || hasFixedPrice || hasFixedAddedAmount;

  if (!params.pricingMode) {
    return options.allowMissingPricingMode ? !hasAnyPricingValue : false;
  }

  if (params.pricingMode === PRODUCT_PRICING_MODES.COEFFICIENT) {
    return hasCoefficient && !hasFixedPrice && !hasFixedAddedAmount;
  }

  if (params.pricingMode === PRODUCT_PRICING_MODES.FIXED_PRICE) {
    return !hasCoefficient && hasFixedPrice && !hasFixedAddedAmount;
  }

  if (params.pricingMode === PRODUCT_PRICING_MODES.FIXED_ADDED_AMOUNT) {
    return !hasCoefficient && !hasFixedPrice && hasFixedAddedAmount;
  }

  return false;
};

export const getPricingModeParametersErrorMessage = (
  params: PricingModeParameters,
  options: PricingModeValidationOptions = {},
): string => {
  if (!params.pricingMode) {
    return options.allowMissingPricingMode
      ? 'pricingMode is required when updating pricing values'
      : 'pricingMode is required';
  }

  if (params.pricingMode === PRODUCT_PRICING_MODES.COEFFICIENT) {
    return 'coefficient must be provided and fixedPrice/fixedAddedAmount must be empty';
  }

  if (params.pricingMode === PRODUCT_PRICING_MODES.FIXED_PRICE) {
    return 'fixedPrice must be provided and coefficient/fixedAddedAmount must be empty';
  }

  if (params.pricingMode === PRODUCT_PRICING_MODES.FIXED_ADDED_AMOUNT) {
    return 'fixedAddedAmount must be provided and coefficient/fixedPrice must be empty';
  }

  return 'invalid pricing mode parameters';
};
