import React from 'react';

import Analyzer, { SELECTED_PLAYER } from 'parser/core/Analyzer';
import Events from 'parser/core/Events';

import SPELLS from 'common/SPELLS';

import Statistic from 'interface/statistics/Statistic';
import BoringSpellValueText from 'interface/statistics/components/BoringSpellValueText';
import STATISTIC_ORDER from 'interface/others/STATISTIC_ORDER';

const BUFF_DURATION = 12000;
const BUFFER = 100;

class Nightfall extends Analyzer {
  wastedProcs = 0;
  buffApplyTimestamp = null;

  constructor(...args) {
    super(...args);
    this.active = this.selectedCombatant.hasTalent(SPELLS.NIGHTFALL_TALENT.id);
    this.addEventListener(Events.applybuff.by(SELECTED_PLAYER).spell(SPELLS.NIGHTFALL_BUFF), this.onNightfallApplyRefresh);
    this.addEventListener(Events.refreshbuff.by(SELECTED_PLAYER).spell(SPELLS.NIGHTFALL_BUFF), this.onNightfallApplyRefresh);
    this.addEventListener(Events.removebuff.by(SELECTED_PLAYER).spell(SPELLS.NIGHTFALL_BUFF), this.onNightfallRemove);
  }

  onNightfallApplyRefresh(event) {
    if (this.buffApplyTimestamp !== null) {
      this.wastedProcs += 1;
    }
    this.buffApplyTimestamp = event.timestamp;
  }

  onNightfallRemove(event) {
    const expectedEnd = this.buffApplyTimestamp + BUFF_DURATION;
    if ((expectedEnd - BUFFER) <= event.timestamp && event.timestamp <= (expectedEnd + BUFFER)) {
      // buff fell off naturally
      this.wastedProcs += 1;
    }
    this.buffApplyTimestamp = null;
  }

  statistic() {
    return (
      <Statistic
        position={STATISTIC_ORDER.OPTIONAL(1)}
        size="small"
      >
        <BoringSpellValueText spell={SPELLS.NIGHTFALL_TALENT}>
          {this.wastedProcs} <small>wasted procs</small>
        </BoringSpellValueText>
      </Statistic>
    );
  }
}

export default Nightfall;
