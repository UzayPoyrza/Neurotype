import React, { ReactNode } from 'react';
import { StyleSheet, StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

type MergedCardSectionProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  hideDividerBefore?: boolean;
};

type MergedCardProps = {
  children: ReactNode;
  outerStyle?: StyleProp<ViewStyle>;
  cardStyle?: StyleProp<ViewStyle>;
  sectionStyle?: StyleProp<ViewStyle>;
  dividerStyle?: StyleProp<ViewStyle>;
};

const SectionComponent: React.FC<MergedCardSectionProps> = ({ children }) => <>{children}</>;

const MergedCardBase: React.FC<MergedCardProps> = ({
  children,
  outerStyle,
  cardStyle,
  sectionStyle,
  dividerStyle,
}) => {
  const theme = useTheme();
  const childArray = React.Children.toArray(children).filter(Boolean);

  if (childArray.length === 0) {
    return null;
  }

  return (
    <View style={[styles.outer, outerStyle]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
          },
          cardStyle,
        ]}
      >
        {childArray.map((child, index) => {
          if (React.isValidElement(child) && child.type === SectionComponent) {
            const { style: childStyle, children: sectionChildren, hideDividerBefore } =
              child.props as MergedCardSectionProps;
            const nextChild = childArray[index + 1];
            const nextChildHideDividerBefore = React.isValidElement(nextChild) &&
              nextChild.type === SectionComponent &&
              (nextChild.props as MergedCardSectionProps).hideDividerBefore;

            return (
              <React.Fragment key={index}>
                <View
                  style={[
                    styles.section,
                    { backgroundColor: theme.colors.surface },
                    sectionStyle,
                    childStyle,
                  ]}
                >
                  {sectionChildren}
                </View>
                {index < childArray.length - 1 && !nextChildHideDividerBefore && (
                  <View
                    style={[
                      styles.divider,
                      { backgroundColor: theme.colors.borderMedium },
                      dividerStyle,
                    ]}
                  />
                )}
              </React.Fragment>
            );
          }

          return (
            <React.Fragment key={index}>
              <View style={[styles.section, { backgroundColor: theme.colors.surface }, sectionStyle]}>{child}</View>
              {index < childArray.length - 1 && (
                <View
                  style={[
                    styles.divider,
                    { backgroundColor: theme.colors.borderMedium },
                    dividerStyle,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

export const MergedCard = Object.assign(MergedCardBase, {
  Section: SectionComponent,
});

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: 'transparent',
  },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
  },
  section: {
    paddingVertical: 16,
  },
  divider: {
    height: 0.5,
    marginHorizontal: 16,
  },
});
