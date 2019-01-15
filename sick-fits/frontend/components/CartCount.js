import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

// this should not be a span, it is not valid html!!
const AnimationStyles = styled.span`
  position: relative;
  .count {
    display: block;
    position: relative;
    backface-visibility: hidden;
    transition: all 4000ms; /* seems to be broken in Chrome, can be fixed by transition on active classes */
  }
  /* Initial State of the entered dot */
  .count-enter {
    transform: rotateX(0.5turn);
  }
  .count-enter-active {
    transform: rotateX(0);
    /* transition: all 4000ms; */
  }
  .count-exit {
    position: absolute;
    top: 0;
    transform: rotateX(0);
  }
  .count-exit-active {
    transform: rotateX(0.5turn);
    /* transition: all 4000ms; */
  }
`;

const Dot = styled.div`
  background: ${props => props.theme.red};
  color: white;
  border-radius: 50%;
  padding: 0.5rem;
  line-height: 2rem;
  min-width: 3rem;
  margin-left: 1rem;
  font-weight: 100;
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
  /* font-feature-settings and font-variant-numeric fixes the width of the fonts when switching from skinny to fat characters */
`;

const CartCount = ({ count }) => (
  <AnimationStyles>
    <TransitionGroup>
      <CSSTransition
        unmountOnExit
        className="count"
        classNames="count"
        key={count}
        timeout={{ enter: 4000, exit: 4000 }}
      >
        <Dot>{count}</Dot>
      </CSSTransition>
    </TransitionGroup>
  </AnimationStyles>
);

export default CartCount;
