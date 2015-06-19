/*
 * Copyright 2015 by the Metanome project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package de.metanome.backend.result_postprocessing.result_analyzer;

import de.metanome.algorithm_integration.input.InputGenerationException;
import de.metanome.algorithm_integration.input.InputIterationException;
import de.metanome.algorithm_integration.input.RelationalInputGenerator;
import de.metanome.algorithm_integration.results.UniqueColumnCombination;
import de.metanome.backend.result_postprocessing.result_ranking.UniqueColumnCombinationRanking;
import de.metanome.backend.result_postprocessing.results.UniqueColumnCombinationResult;

import java.util.ArrayList;
import java.util.List;

/**
 * Analyzes Unique Column Combination Results.
 */
public class UniqueColumnCombinationResultAnalyzer
    extends ResultAnalyzer<UniqueColumnCombination, UniqueColumnCombinationResult> {

  public UniqueColumnCombinationResultAnalyzer(List<RelationalInputGenerator> inputGenerators,
                                               boolean useDataDependentStatistics)
      throws InputGenerationException, InputIterationException {
    super(inputGenerators, useDataDependentStatistics);
  }

  @Override
  protected List<UniqueColumnCombinationResult> analyzeResultsDataIndependent(
      List<UniqueColumnCombination> prevResults) {
    List<UniqueColumnCombinationResult> results = convertResults(prevResults);

    if (!this.tableInformationMap.isEmpty()) {
      UniqueColumnCombinationRanking ranking =
          new UniqueColumnCombinationRanking(results, tableInformationMap);
      ranking.calculateDataIndependentRankings();
    }

    return results;
  }

  @Override
  protected List<UniqueColumnCombinationResult> analyzeResultsDataDependent(
      List<UniqueColumnCombination> prevResults) {
    List<UniqueColumnCombinationResult> results = convertResults(prevResults);

    if (!this.tableInformationMap.isEmpty()) {
      UniqueColumnCombinationRanking ranking =
          new UniqueColumnCombinationRanking(results, tableInformationMap);
      ranking.calculateDataDependentRankings();
    }

    return results;
  }

  @Override
  public void printResultsToFile() {

  }

  @Override
  protected List<UniqueColumnCombinationResult> convertResults(
      List<UniqueColumnCombination> prevResults) {
    List<UniqueColumnCombinationResult> results = new ArrayList<>();

    for (UniqueColumnCombination prevResult : prevResults) {
      UniqueColumnCombinationResult result = new UniqueColumnCombinationResult(prevResult);
      results.add(result);
    }

    return results;
  }

}
