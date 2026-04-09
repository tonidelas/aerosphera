import React from 'react';
import styled from 'styled-components';
import { BoardRule } from '../../types/moderation';

const RulesContainer = styled.div`
  background: rgba(245, 245, 247, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(29, 107, 167, 0.08);
`;

const RulesTitle = styled.h3`
  color: var(--text);
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(52, 165, 216, 0.2);
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RuleItem = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const RuleNumber = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #52A5D8, #1D6BA7);
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
`;

const RuleContent = styled.div``;

const RuleTitle = styled.div`
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text);
  margin-bottom: 2px;
`;

const RuleDescription = styled.div`
  font-size: 0.8rem;
  color: #666;
  line-height: 1.4;
`;

const EmptyRules = styled.div`
  font-size: 0.85rem;
  color: #999;
  text-align: center;
  padding: 8px 0;
`;

interface SpheraRulesProps {
  rules: BoardRule[];
}

const SpheraRules: React.FC<SpheraRulesProps> = ({ rules }) => {
  if (rules.length === 0) return null;

  return (
    <RulesContainer>
      <RulesTitle>📋 Sphera Rules</RulesTitle>
      {rules.length === 0 ? (
        <EmptyRules>No rules set yet.</EmptyRules>
      ) : (
        rules.map((rule, index) => (
          <RuleItem key={rule.id}>
            <RuleNumber>{index + 1}</RuleNumber>
            <RuleContent>
              <RuleTitle>{rule.title}</RuleTitle>
              {rule.description && (
                <RuleDescription>{rule.description}</RuleDescription>
              )}
            </RuleContent>
          </RuleItem>
        ))
      )}
    </RulesContainer>
  );
};

export default SpheraRules;
