import React, { ReactNode } from 'react';
import { StyleSheet, StyleProp, View, ViewStyle } from 'react-native';

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
  const childArray = React.Children.toArray(children).filter(Boolean);

  if (childArray.length === 0) {
    return null;
  }

  return (
    <View style={[styles.outer, outerStyle]}>
      <View style={[styles.card, cardStyle]}>
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
                <View style={[styles.section, sectionStyle, childStyle]}>
                  {sectionChildren}
                </View>
                {index < childArray.length - 1 && !nextChildHideDividerBefore && (
                  <View style={[styles.divider, dividerStyle]} />
                )}
              </React.Fragment>
            );
          }

          return (
            <React.Fragment key={index}>
              <View style={[styles.section, sectionStyle]}>{child}</View>
              {index < childArray.length - 1 && (
                <View style={[styles.divider, dividerStyle]} />
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
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  section: {
    paddingVertical: 16,
    backgroundColor: '#1C1C1E',
  },
  divider: {
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 16,
  },
});

