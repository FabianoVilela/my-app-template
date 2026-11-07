# Adding a business module

This recipe walks through one feature from its port to its route, using the
`products` example from the [HTTP guide](http-client.md#example-product-service):
a screen that loads a product by id. It is a guide for a derived project. Do not
add this module to the template.

The [application architecture](AGENTS.md) owns the rules; this guide shows how
they connect. Biome rejects imports that cross layers the wrong way; see
[layer import boundaries](../conventions/biome.md#layer-import-boundaries).

## Files

| Step | File | Layer |
| --- | --- | --- |
| 1 | `src/modules/products/` | Module directory |
| 2 | `domain/*.ts`, only for business rules | Domain |
| 3 | `application/ports/product-service.ts` | Application |
| 4 | `infrastructure/product-service.ts` and `infrastructure/schemas/*.schema.ts` | Module infrastructure |
| 5 | `presentation/product-service-provider.tsx`, `presentation/hooks/use-product.ts`, `presentation/screens/product-screen.tsx` | Presentation |
| 6 | `src/infrastructure/i18n/locales/<locale>/products.json` | Root i18n infrastructure |
| 7 | `src/bootstrap/create-dependencies.ts` and the provider composition | Bootstrap |
| 8 | `src/app/products/[productId].tsx` | Route |
| 9 | Colocated `*.test.ts` and `*.test.tsx` files | Each layer |

Paths in steps 2 to 5 are relative to `src/modules/products/`.

## 1. Create the module

Name the module after the business capability, in `kebab-case`. In a derived
project, rename a numbered placeholder (`git mv src/modules/module-1
src/modules/products`) or create a new directory with only the layers you need.
Remove each `.gitkeep` once its directory has a real file, and delete the
remaining placeholder modules when the product no longer needs them.

Inside the module, import its own files with relative paths, such as
`../application/ports/product-service`. Lint rejects `@/modules/products/...`
from inside a module. Do not add an `index.ts` until another module has a real
consumer for it.

## 2. Domain, only for business rules

Add `domain/` files when the client must enforce business knowledge: invariants,
policies or calculations. A screen that only shows server data needs none. Keep
domain code pure: it may import only other domain files and `@/shared/lib`.

## 3. Application port

Write `application/ports/product-service.ts` exactly as in the
[HTTP guide](http-client.md#example-product-service): the `Product` type the
consumers need, the `ProductService` interface and the named errors that callers
can distinguish. The port names a capability, not a transport, so it has no HTTP
or Zod imports.

Add an application operation file only when there is orchestration to own, such
as combining two ports or applying a domain policy. Do not wrap a single port
call in a pass-through use case.

## 4. Infrastructure adapter

Write the request and response schemas under `infrastructure/schemas/` and the
`createProductService(http)` factory in `infrastructure/product-service.ts`, as
in the [HTTP guide](http-client.md#example-product-service). The adapter
validates the request before calling HTTP, validates the response before mapping
it, and translates external fields such as `display_name` into the
application-owned `Product`. See [validation](validation.md) for schema policy.

## 5. Presentation

A focused provider gives screens the service without importing bootstrap or the
concrete adapter. Write `presentation/product-service-provider.tsx`:

```tsx
import { createContext, type ReactNode, useContext } from "react";
import type { ProductService } from "../application/ports/product-service";

const ProductServiceContext = createContext<ProductService | null>(null);

type ProductServiceProviderProps = {
  children: ReactNode;
  productService: ProductService;
};

export function ProductServiceProvider({
  children,
  productService,
}: ProductServiceProviderProps) {
  return (
    <ProductServiceContext value={productService}>
      {children}
    </ProductServiceContext>
  );
}

export function useProductService() {
  const productService = useContext(ProductServiceContext);
  if (!productService) throw new Error("ProductServiceProvider is required");

  return productService;
}
```

Pass the service through props instead when only one screen uses it; add a
provider when it avoids passing the service through several components.

The hook connects the operation to React and owns the request lifecycle. Write
`presentation/hooks/use-product.ts`:

```ts
import { useEffect, useState } from "react";
import type { Product } from "../../application/ports/product-service";
import { useProductService } from "../product-service-provider";

type ProductState =
  | { status: "loading" }
  | { status: "loaded"; product: Product }
  | { status: "failed" };

type ProductResult = Exclude<ProductState, { status: "loading" }> & {
  productId: string;
};

export function useProduct(productId: string): ProductState {
  const productService = useProductService();
  const [result, setResult] = useState<ProductResult | null>(null);

  useEffect(() => {
    let isActive = true;

    productService.getProductById(productId).then(
      (product) => {
        if (isActive) setResult({ productId, status: "loaded", product });
      },
      () => {
        if (isActive) setResult({ productId, status: "failed" });
      },
    );

    return () => {
      isActive = false;
    };
  }, [productService, productId]);

  // A result for a previous productId is stale until the new request settles.
  if (result?.productId !== productId) return { status: "loading" };

  return result;
}
```

The hook derives `loading` from the stored result instead of resetting state
inside the effect, which the React Compiler lint reports. The `isActive` flag
ignores a response that settles after the id changes or the screen unmounts. The
template has no server-state library yet; when one is adopted, it replaces this
hand-written lifecycle.

The screen maps states to UI and messages. Write
`presentation/screens/product-screen.tsx`:

```tsx
import { ActivityIndicator, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useAppTranslation } from "@/shared/i18n";
import { useProduct } from "../hooks/use-product";

type ProductScreenProps = {
  productId: string;
};

export function ProductScreen({ productId }: ProductScreenProps) {
  const { t } = useAppTranslation("products");
  const state = useProduct(productId);

  return (
    <View style={styles.container}>
      {state.status === "loading" && (
        <ActivityIndicator accessibilityLabel={t("loading")} />
      )}
      {state.status === "failed" && (
        <Text accessibilityRole="alert">{t("loadFailed")}</Text>
      )}
      {state.status === "loaded" && (
        <Text accessibilityRole="header">{state.product.name}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
}));
```

Follow the [styling rule](../conventions/AGENTS.md#typescript-components-and-styles):
styles come from Unistyles theme tokens. Map failures to messages here; never render
`HttpError`, Zod errors or their `cause`. To distinguish failures, such as
not found and offline, define that meaning in the port's errors and translate it
in the adapter.

## 6. Translations

Create `products.json` in each locale directory under
`src/infrastructure/i18n/locales/`, with the same keys:

```json
{
  "loading": "Loading product",
  "loadFailed": "The product could not be loaded."
}
```

Run `pnpm i18n:types` and commit the regenerated
`src/shared/i18n/app-messages.ts` and `src/infrastructure/i18n/resources.ts`;
the generator registers the new namespace for every locale, so the adapter does
not change. See [catalog maintenance](i18n.md#catalog-maintenance).

## 7. Bootstrap

Write `src/bootstrap/create-dependencies.ts` as shown in
[default client and overrides](http-client.md#default-client-and-overrides). It
selects the Axios client, accepts an HTTP override and returns
`{ productService }`.

Call `createDependencies()` once inside `startup()` in
`src/bootstrap/startup.ts`, which already creates the i18n adapter, so a missing
API URL goes through the existing startup failure and retry path. Add its result
to `AppDependencies` as its own entry and return it with the session:

```ts
export type AppDependencies = {
  i18n: Awaited<ReturnType<typeof createI18nextAdapter>>;
  productService: ProductService;
};

// In startup(), after creating i18n:
const { productService } = createDependencies();

return {
  dependencies: { i18n, productService },
  dispose: () => subscription.remove(),
};
```

Then wrap the children in `src/bootstrap/app-providers.tsx`, passing each
provider only its own entry:

```tsx
<AppTranslationProvider {...state.dependencies.i18n}>
  <ProductServiceProvider productService={state.dependencies.productService}>
    {children}
  </ProductServiceProvider>
</AppTranslationProvider>
```

Do not call the factory during render or export an instance from a module.

## 8. Route

Routes adapt navigation input and delegate to the screen. Write
`src/app/products/[productId].tsx`:

```tsx
import { useLocalSearchParams } from "expo-router";
import { ProductScreen } from "@/modules/products/presentation/screens/product-screen";

export default function ProductRoute() {
  const { productId } = useLocalSearchParams<{ productId: string }>();

  return <ProductScreen productId={productId} />;
}
```

The route filename defines the `/products/:productId` URL and deep link. See
[Expo Router filenames](../conventions/AGENTS.md#expo-router-filenames).

## 9. Tests by layer

Follow the [testing guide](../testing.md) for environments and placement.

| Layer | Test | Approach |
| --- | --- | --- |
| Domain and application | `*.test.ts` | Pure functions and operations with typed port fakes; no React, HTTP or storage |
| Module infrastructure | `product-service.test.ts` | Real Axios client against the shared MSW server |
| Presentation | `product-screen.test.tsx` | Fake `ProductService` through the provider, real i18n instance |
| Route | `tests/*.test.tsx`, when navigation matters | `renderRouter`, as in `tests/navigation.test.tsx` |

`infrastructure/product-service.test.ts` covers mapping, an unexpected payload
and an invalid request that must not reach HTTP:

```ts
import { HttpResponse, http } from "msw/http";
import { createAxiosHttpClient } from "@/infrastructure/http/axios-http-client";
import { httpServer } from "../../../../tests/http-server";
import {
  InvalidProductRequestError,
  InvalidProductResponseError,
} from "../application/ports/product-service";
import { createProductService } from "./product-service";

const BASE_URL = "https://api.example.test";

describe("product service", () => {
  const service = createProductService(
    createAxiosHttpClient({ baseUrl: BASE_URL }),
  );

  test("maps the response to the application model", async () => {
    httpServer.use(
      http.get(`${BASE_URL}/products/123`, () =>
        HttpResponse.json({ id: "123", display_name: "Keyboard" }),
      ),
    );

    await expect(service.getProductById("123")).resolves.toEqual({
      id: "123",
      name: "Keyboard",
    });
  });

  test("rejects an unexpected payload", async () => {
    httpServer.use(
      http.get(`${BASE_URL}/products/123`, () => HttpResponse.json({})),
    );

    await expect(service.getProductById("123")).rejects.toBeInstanceOf(
      InvalidProductResponseError,
    );
  });

  test("rejects an invalid id without sending a request", async () => {
    await expect(service.getProductById("")).rejects.toBeInstanceOf(
      InvalidProductRequestError,
    );
  });
});
```

The shared server fails on unhandled requests, so the last test also proves
that no request was sent.

`presentation/screens/product-screen.test.tsx` renders the screen with a fake
service. Presentation tests may import the real i18n adapter; production
presentation code may not.

```tsx
jest.mock("react-native-nitro-modules", () => ({}));

import { render, screen } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { createI18nextAdapter } from "@/infrastructure/i18n/i18next-adapter";
import { AppTranslationProvider } from "@/shared/i18n";
import type { ProductService } from "../../application/ports/product-service";
import { ProductServiceProvider } from "../product-service-provider";
import { ProductScreen } from "./product-screen";

async function renderScreen(productService: ProductService) {
  const i18n = await createI18nextAdapter({
    storage: {
      getItem: () => "en",
      setItem: () => undefined,
      removeItem: () => undefined,
    },
    getDeviceLocales: () => [],
    onReadError: () => undefined,
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AppTranslationProvider {...i18n}>
      <ProductServiceProvider productService={productService}>
        {children}
      </ProductServiceProvider>
    </AppTranslationProvider>
  );

  await render(<ProductScreen productId="123" />, { wrapper });
}

test("shows the loaded product name", async () => {
  await renderScreen({
    getProductById: async (id) => ({ id, name: "Keyboard" }),
  });

  expect(
    await screen.findByRole("header", { name: "Keyboard" }),
  ).toBeOnTheScreen();
});

test("shows an alert when loading fails", async () => {
  await renderScreen({
    getProductById: () => Promise.reject(new Error("offline")),
  });

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "The product could not be loaded.",
  );
});
```

A factory that only connects dependencies needs no test of its own. Test
`createDependencies` when it gains logic, such as choosing between clients.

## Checklist

- [ ] The module is named after a business capability and contains only the layers it uses; placeholders and `.gitkeep` files you replaced are gone.
- [ ] Domain and application import nothing beyond their own files and `@/shared/lib`.
- [ ] The adapter validates requests and responses and maps external fields; no Zod, DTO or HTTP type crosses the port.
- [ ] Presentation receives the service through props or a provider; it does not import infrastructure or bootstrap.
- [ ] Every locale has the namespace with the same keys, the adapter registers it and `app-messages.ts` is regenerated.
- [ ] Bootstrap creates the dependencies once, during startup, and the route stays thin.
- [ ] Each layer has tests for its behavior, and the screen has accessible names and roles.
- [ ] `pnpm check`, `pnpm typecheck`, `pnpm i18n:check` and `pnpm test` pass.
- [ ] New native dependencies, if any, were added with `pnpm expo install` and verified in a rebuilt development build.
