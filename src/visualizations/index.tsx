import type { VizProps, VisSpec } from "./helpers";

import LinearFunctionViz, { linearFunctionSpec } from "./linear-function";
import QuadraticViz, { quadraticSpec } from "./quadratic";
import SequenceLimitViz, { sequenceLimitSpec } from "./sequence-limit";
import FreeFallViz, { freeFallSpec } from "./free-fall";
import ProjectileViz, { projectileSpec } from "./projectile";
import RlcViz, { rlcSpec } from "./rlc";
import SolubilityViz, { solubilitySpec } from "./solubility";
import EquilibriumViz, { equilibriumSpec } from "./equilibrium";
import IsomerViz, { isomerSpec } from "./isomer";
import LinearEquationViz, { linearEquationSpec } from "./linear-equation";
import AcceleratedMotionViz, { acceleratedMotionSpec } from "./accelerated-motion";

// 新增可视化组件
import ExpLogViz, { expLogSpec } from "./exp-log";
import DerivativeViz, { derivativeSpec } from "./derivative";
import ConicSectionViz, { conicSectionSpec } from "./conic-section";
import VectorDotViz, { vectorDotSpec } from "./vector-dot";
import { ArithmeticSeqViz, arithmeticSeqSpec, GeometricSeqViz, geometricSeqSpec } from "./sequences";
import Coord3DViz, { coord3DSpec } from "./coord-3d";
import { MomentumViz, momentumSpec, KineticEnergyViz, kineticEnergySpec, GravitationViz, gravitationSpec, CoulombViz, coulombSpec, OhmViz, ohmSpec, WaveViz, waveSpec, RefractionViz, refractionSpec } from "./physics-viz";
import { ConcentrationViz, concentrationSpec, GasLawViz, gasLawSpec, EquilibriumConstViz, equilibriumConstSpec, TitrationViz, titrationSpec } from "./chemistry-viz";
import { BinomialViz, binomialSpec, ComplexNumberViz, complexNumberSpec, ACEffectiveViz, acEffectiveSpec, FaradayViz, faradaySpec, MechanicalEnergyViz, mechanicalEnergySpec, KspViz, kspSpec, KwViz, kwSpec, KaViz, kaSpec } from "./simple-viz";

// 小学数学
import { FractionViz, fractionSpec, AreaViz, areaSpec, RatioViz, ratioSpec, SimpleEquationViz, simpleEquationSpec, CoordViz, coordSpec } from "./primary-math-viz";
// 小学科学
import { MatterStatesViz, matterStatesSpec } from "./primary-science-viz";
// 初中数学
import { AbsoluteValueViz, absoluteValueSpec, LinearSystemViz, linearSystemSpec, InequalityViz, inequalitySpec, PythagoreanViz, pythagoreanSpec, SimilarViz, similarSpec, CircleViz, circleSpec, ProbabilityViz, probabilitySpec } from "./junior-math-viz";
// 初中物理
import { DensityViz, densitySpec, PressureViz, pressureSpec, BuoyancyViz, buoyancySpec, LeverViz, leverSpec, ElectricPowerViz, electricPowerSpec } from "./junior-physics-viz";
// 初中化学
import { MassConservationViz, massConservationSpec, MassFractionViz, massFractionSpec, AcidBasePHViz, acidBasePHSpec } from "./junior-chemistry-viz";

export const VIZ: Record<string, React.ComponentType<VizProps>> = {
  // 原有
  "linear-function": LinearFunctionViz,
  quadratic: QuadraticViz,
  "sequence-limit": SequenceLimitViz,
  "free-fall": FreeFallViz,
  projectile: ProjectileViz,
  rlc: RlcViz,
  solubility: SolubilityViz,
  equilibrium: EquilibriumViz,
  isomer: IsomerViz,
  "linear-equation": LinearEquationViz,
  "accelerated-motion": AcceleratedMotionViz,
  // 高中数学
  "exp-log": ExpLogViz,
  derivative: DerivativeViz,
  "conic-section": ConicSectionViz,
  "vector-dot": VectorDotViz,
  "arithmetic-seq": ArithmeticSeqViz,
  "geometric-seq": GeometricSeqViz,
  "coord-3d": Coord3DViz,
  binomial: BinomialViz,
  "complex-number": ComplexNumberViz,
  // 高中物理
  momentum: MomentumViz,
  "kinetic-energy": KineticEnergyViz,
  "mechanical-energy": MechanicalEnergyViz,
  gravitation: GravitationViz,
  coulomb: CoulombViz,
  ohm: OhmViz,
  faraday: FaradayViz,
  "ac-effective": ACEffectiveViz,
  wave: WaveViz,
  refraction: RefractionViz,
  // 高中化学
  concentration: ConcentrationViz,
  "gas-law": GasLawViz,
  "equilibrium-const": EquilibriumConstViz,
  ka: KaViz,
  kw: KwViz,
  ksp: KspViz,
  titration: TitrationViz,
  // 小学数学
  fraction: FractionViz,
  area: AreaViz,
  ratio: RatioViz,
  "simple-equation": SimpleEquationViz,
  coord: CoordViz,
  // 小学科学
  "matter-states": MatterStatesViz,
  // 初中数学
  "absolute-value": AbsoluteValueViz,
  "linear-system": LinearSystemViz,
  inequality: InequalityViz,
  pythagorean: PythagoreanViz,
  similar: SimilarViz,
  circle: CircleViz,
  probability: ProbabilityViz,
  // 初中物理
  density: DensityViz,
  pressure: PressureViz,
  buoyancy: BuoyancyViz,
  lever: LeverViz,
  "electric-power": ElectricPowerViz,
  // 初中化学
  "mass-conservation": MassConservationViz,
  "mass-fraction": MassFractionViz,
  "acid-base-ph": AcidBasePHViz,
};

export const VIZ_SPECS: Record<string, VisSpec> = {
  // 原有
  "linear-function": linearFunctionSpec,
  quadratic: quadraticSpec,
  "sequence-limit": sequenceLimitSpec,
  "free-fall": freeFallSpec,
  projectile: projectileSpec,
  rlc: rlcSpec,
  solubility: solubilitySpec,
  equilibrium: equilibriumSpec,
  isomer: isomerSpec,
  "linear-equation": linearEquationSpec,
  "accelerated-motion": acceleratedMotionSpec,
  // 高中数学
  "exp-log": expLogSpec,
  derivative: derivativeSpec,
  "conic-section": conicSectionSpec,
  "vector-dot": vectorDotSpec,
  "arithmetic-seq": arithmeticSeqSpec,
  "geometric-seq": geometricSeqSpec,
  "coord-3d": coord3DSpec,
  binomial: binomialSpec,
  "complex-number": complexNumberSpec,
  // 高中物理
  momentum: momentumSpec,
  "kinetic-energy": kineticEnergySpec,
  "mechanical-energy": mechanicalEnergySpec,
  gravitation: gravitationSpec,
  coulomb: coulombSpec,
  ohm: ohmSpec,
  faraday: faradaySpec,
  "ac-effective": acEffectiveSpec,
  wave: waveSpec,
  refraction: refractionSpec,
  // 高中化学
  concentration: concentrationSpec,
  "gas-law": gasLawSpec,
  "equilibrium-const": equilibriumConstSpec,
  ka: kaSpec,
  kw: kwSpec,
  ksp: kspSpec,
  titration: titrationSpec,
  // 小学数学
  fraction: fractionSpec,
  area: areaSpec,
  ratio: ratioSpec,
  "simple-equation": simpleEquationSpec,
  coord: coordSpec,
  // 小学科学
  "matter-states": matterStatesSpec,
  // 初中数学
  "absolute-value": absoluteValueSpec,
  "linear-system": linearSystemSpec,
  inequality: inequalitySpec,
  pythagorean: pythagoreanSpec,
  similar: similarSpec,
  circle: circleSpec,
  probability: probabilitySpec,
  // 初中物理
  density: densitySpec,
  pressure: pressureSpec,
  buoyancy: buoyancySpec,
  lever: leverSpec,
  "electric-power": electricPowerSpec,
  // 初中化学
  "mass-conservation": massConservationSpec,
  "mass-fraction": massFractionSpec,
  "acid-base-ph": acidBasePHSpec,
};

export type { VizProps, VisSpec, PlaybackState } from "./helpers";
