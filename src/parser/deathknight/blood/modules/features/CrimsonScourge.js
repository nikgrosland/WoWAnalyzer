import React from 'react';
import Analyzer from 'parser/core/Analyzer';
import SPELLS from 'common/SPELLS';
import SpellIcon from 'common/SpellIcon';
import { formatPercentage } from 'common/format';
import SpellLink from 'common/SpellLink';
import AbilityTracker from 'parser/shared/modules/AbilityTracker';
import StatisticBox, { STATISTIC_ORDER } from 'interface/others/StatisticBox';
import SpellUsable from 'parser/shared/modules/SpellUsable';

const DURATION_WORTH_CASTING_MS = 8000;

class CrimsonScourge extends Analyzer {
  static dependencies = {
    abilityTracker: AbilityTracker,
    spellUsable: SpellUsable,
  };

  crimsonScourgeProcsCounter = 0;
  freeDeathAndDecayCounter = 0;
  endOfCombatCast = false;

  on_byPlayer_cast(event) {
    const spellId = event.ability.guid;
    if (spellId !== SPELLS.DEATH_AND_DECAY.id) {
      return;
    }
    if (this.selectedCombatant.hasBuff(SPELLS.CRIMSON_SCOURGE.id, event.timestamp)) {
      this.freeDeathAndDecayCounter += 1;
      if(this.endOfCombatCast){
        this.endOfCombatCast = false;
      }
    }
  }
  on_byPlayer_applybuff(event) {
    const spellId = event.ability.guid;
    if (spellId !== SPELLS.CRIMSON_SCOURGE.id) {
      return;
    }
    this.crimsonScourgeProcsCounter += 1;
    if(this.spellUsable.isOnCooldown(SPELLS.DEATH_AND_DECAY.id)){
      this.spellUsable.endCooldown(SPELLS.DEATH_AND_DECAY.id);
    }
    if(event.timestamp + DURATION_WORTH_CASTING_MS > this.owner.fight.end_time){
      this.endOfCombatCast = true;
    }
  }

  get wastedCrimsonScourgeProcs(){
    const wastedProcs = this.crimsonScourgeProcsCounter - this.freeDeathAndDecayCounter;
    if(this.endOfCombatCast){
      return wastedProcs - 1;
    }
    return wastedProcs;
  }

  get wastedCrimsonScourgeProcsPercent(){
    return this.wastedCrimsonScourgeProcs / this.crimsonScourgeProcsCounter;
  }

  get efficiencySuggestionThresholds() {
    return {
      actual: 1 - this.wastedCrimsonScourgeProcsPercent,
      isLessThan: {
        minor: 0.95,
        average: 0.9,
        major: 0.85,
      },
      style: 'percentage',
    };
  }

  get suggestionThresholds() {
    return {
      actual: this.wastedCrimsonScourgeProcsPercent,
      isGreaterThan: {
        minor: 0.05,
        average: 0.1,
        major: 0.15,
      },
      style: 'percentage',
    };
  }

  suggestions(when) {
    if(this.selectedCombatant.hasTalent(SPELLS.RAPID_DECOMPOSITION_TALENT.id)){
      return;
    }
    when(this.suggestionThresholds).addSuggestion((suggest, actual, recommended) => {
      return suggest(<>You had unspent <SpellLink id={SPELLS.CRIMSON_SCOURGE.id} /> procs. Make sure you always use them.</>)
        .icon(SPELLS.CRIMSON_SCOURGE.icon)
        .actual(`${formatPercentage(actual)}% Crimson Scourge procs wasted`)
        .recommended(`<${formatPercentage(recommended)}% is recommended`);
    });
  }

  statistic() {
    return (
      <StatisticBox
        icon={<SpellIcon id={SPELLS.CRIMSON_SCOURGE.id} />}
        value={`${formatPercentage(this.wastedCrimsonScourgeProcsPercent)} %`}
        label="Crimson Scourge procs wasted"
        tooltip={`${this.wastedCrimsonScourgeProcs} out of ${this.crimsonScourgeProcsCounter} procs wasted.`}
      />
    );
  }
  statisticOrder = STATISTIC_ORDER.CORE(6);
}

export default CrimsonScourge;
