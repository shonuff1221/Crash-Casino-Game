import { FC } from 'react';
import styles from '../styles/YouLose.module.scss';

interface YouLoseProps {
  userWon: boolean;
  points?: number;
  multiplier?: number;
  onClose?: () => void;
}

const YouLose: FC<YouLoseProps> = ({ userWon, points, multiplier, onClose }) => {
  return (
    <div className={styles.container} onClick={onClose}>
      {userWon ? (
        <h1 className={styles.titleWon}>
          You Won!
          {points && multiplier && (
            <div className={styles.details}>
              Points: {points} × {multiplier}
            </div>
          )}
        </h1>
      ) : (
        <h1 className={styles.title}>
          You Lose
          {points && multiplier && (
            <div className={styles.details}>
              Points: {points} × {multiplier}
            </div>
          )}
        </h1>
      )}
    </div>
  );
};

export default YouLose;