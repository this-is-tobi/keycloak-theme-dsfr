/* eslint-disable react-hooks/exhaustive-deps */
import type { Meta, Story } from "@storybook/react";
import type { ArgType } from "@storybook/addons";
import { useEffect, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import { symToStr } from "tsafe/symToStr";
import {
    useIsDarkModeEnabled,
    chromeFontSizesFactors,
    breakpointsValues,
    useWindowInnerSize,
} from "onyxia-ui";
import type { ThemeProviderProps, ChromeFontSize } from "onyxia-ui";
import { ThemeProvider, Text, useStyles } from "ui/theme";
import { id } from "tsafe/id";
import "onyxia-ui/assets/fonts/WorkSans/font.css";
import { GlobalStyles } from "tss-react/compat";
import { objectKeys } from "tsafe/objectKeys";
import { CoreProvider } from "ui/coreApi/CoreProvider";
import type { Language } from "sill-api";
import { languages } from "sill-api";
import { RouteProvider } from "ui/routes";
import { useLang } from "ui/i18n";

export function getStoryFactory<Props>(params: {
    sectionName: string;
    wrappedComponent: Record<string, (props: Props) => ReturnType<React.FC>>;
    doUseLib?: boolean;
    /** https://storybook.js.org/docs/react/essentials/controls */
    argTypes?: Partial<Record<keyof Props, ArgType>>;
    defaultContainerWidth?: number;
}) {
    const {
        sectionName,
        wrappedComponent,
        argTypes = {},
        doUseLib,
        defaultContainerWidth,
    } = params;

    const Component: React.ComponentType<Props> = Object.entries(wrappedComponent).map(
        ([, component]) => component,
    )[0];

    function ScreenSize() {
        const { windowInnerWidth } = useWindowInnerSize();

        const range = useMemo(() => {
            if (windowInnerWidth >= breakpointsValues["xl"]) {
                return "xl-∞";
            }

            if (windowInnerWidth >= breakpointsValues["lg"]) {
                return "lg-xl";
            }

            if (windowInnerWidth >= breakpointsValues["md"]) {
                return "md-lg";
            }

            if (windowInnerWidth >= breakpointsValues["sm"]) {
                return "sm-md";
            }

            return "0-sm";
        }, [windowInnerWidth]);

        return (
            <Text typo="body 1">
                {windowInnerWidth}px width: {range}
            </Text>
        );
    }

    const StoreProviderOrFragment: React.ComponentType<{ children: ReactNode }> =
        !doUseLib
            ? ({ children }) => <>{children}</>
            : ({ children }) => <CoreProvider>{children}</CoreProvider>;

    const Template: Story<
        Props & {
            darkMode: boolean;
            containerWidth: number;
            chromeFontSize: ChromeFontSize;
            targetWindowInnerWidth: number;
            lang: Language;
        }
    > = ({
        darkMode,
        containerWidth,
        targetWindowInnerWidth,
        chromeFontSize,
        lang,
        ...props
    }) => {
        const { setIsDarkModeEnabled } = useIsDarkModeEnabled();

        useEffect(() => {
            setIsDarkModeEnabled(darkMode);
        }, [darkMode]);

        const { setLang } = useLang();

        useEffect(() => {
            setLang(lang);
        }, [lang]);

        const getViewPortConfig = useCallback<
            NonNullable<ThemeProviderProps["getViewPortConfig"]>
        >(
            ({ windowInnerWidth }) => ({
                "targetBrowserFontSizeFactor": chromeFontSizesFactors[chromeFontSize],
                "targetWindowInnerWidth": targetWindowInnerWidth || windowInnerWidth,
            }),
            [targetWindowInnerWidth, chromeFontSize],
        );

        const { theme } = useStyles();

        return (
            <>
                {
                    <GlobalStyles
                        styles={{
                            "html": {
                                "fontSize": "100% !important",
                            },
                            "body": {
                                "padding": `0 !important`,
                                "backgroundColor": `${theme.colors.useCases.surfaces.surface1} !important`,
                            },
                        }}
                    />
                }
                <ThemeProvider getViewPortConfig={getViewPortConfig}>
                    <ScreenSize />
                    <div
                        style={{
                            "width": containerWidth || undefined,
                            "border": "1px dotted grey",
                            "display": "inline-block",
                        }}
                    >
                        <StoreProviderOrFragment>
                            <RouteProvider>
                                <Component {...(props as any)} />
                            </RouteProvider>
                        </StoreProviderOrFragment>
                    </div>
                </ThemeProvider>
            </>
        );
    };

    function getStory(props: Props): typeof Template {
        const out = Template.bind({});

        out.args = {
            "darkMode": false,
            "containerWidth": defaultContainerWidth ?? 0,
            "targetWindowInnerWidth": 0,
            "chromeFontSize": "Medium (Recommended)",
            "lang": id<Language>("en"),
            ...props,
        };

        return out;
    }

    return {
        "meta": id<Meta>({
            "title": `${sectionName}/${symToStr(wrappedComponent)}`,
            "component": Component,
            "argTypes": {
                "containerWidth": {
                    "control": {
                        "type": "range",
                        "min": 0,
                        "max": 1920,
                        "step": 1,
                    },
                },
                "targetWindowInnerWidth": {
                    "control": {
                        "type": "range",
                        "min": 0,
                        "max": 2560,
                        "step": 10,
                    },
                },
                "chromeFontSize": {
                    "options": objectKeys(chromeFontSizesFactors),
                    "control": { "type": "select" },
                },
                "lang": {
                    "options": languages,
                    "control": {
                        "type": "inline-radio",
                    },
                },
                ...argTypes,
            },
        }),
        getStory,
    };
}

export function logCallbacks<T extends string>(
    propertyNames: readonly T[],
): Record<T, () => void> {
    const out: Record<T, () => void> = id<Record<string, never>>({});

    propertyNames.forEach(
        propertyName => (out[propertyName] = console.log.bind(console, propertyName)),
    );

    return out;
}
